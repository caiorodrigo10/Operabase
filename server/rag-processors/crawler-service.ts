import puppeteer from "puppeteer";

export interface CrawledPage {
  url: string;
  title: string;
  content: string;
  wordCount: number;
  isValid: boolean;
  error?: string;
}

export interface CrawlOptions {
  maxPages?: number;
  respectRobotsTxt?: boolean;
  excludePatterns?: string[];
  includePatterns?: string[];
}

export class CrawlerService {
  private browser: any = null;

  constructor() {
    // Browser will be launched on demand
  }

  private async getBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
    }
    return this.browser;
  }

  async crawlSinglePage(url: string): Promise<CrawledPage> {
    let page = null;
    try {
      console.log(`🔍 Extraindo conteúdo da página: ${url}`);
      
      const browser = await this.getBrowser();
      page = await browser.newPage();
      
      // Set user agent to avoid bot detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to page with timeout
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });

      // Extract title and content
      const pageData = await page.evaluate(() => {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style, nav, footer, header');
        scripts.forEach(el => el.remove());

        const title = document.title || '';
        
        // Get main content, prioritizing article, main, or body
        let contentElement = document.querySelector('article') || 
                           document.querySelector('main') || 
                           document.querySelector('.content') ||
                           document.querySelector('#content') ||
                           document.body;

        const content = contentElement ? contentElement.innerText || contentElement.textContent || '' : '';

        return { title, content };
      });

      await page.close();

      const cleanContent = this.cleanContent(pageData.content);
      const title = pageData.title || this.getTitleFromUrl(url);

      return {
        url,
        title,
        content: cleanContent,
        wordCount: this.countWords(cleanContent),
        isValid: cleanContent.length > 50,
      };
    } catch (error) {
      if (page) {
        try {
          await page.close();
        } catch {}
      }
      
      console.error(`❌ Erro ao extrair página ${url}:`, error);
      return {
        url,
        title: 'Erro ao carregar',
        content: '',
        wordCount: 0,
        isValid: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async crawlDomain(baseUrl: string, options: CrawlOptions = {}): Promise<CrawledPage[]> {
    try {
      console.log(`🕷️ Iniciando crawling do domínio: ${baseUrl}`);
      
      const {
        maxPages = 20,
        respectRobotsTxt = true,
        excludePatterns = [
          '/privacy', '/terms', '/cookie', '/legal',
          '.pdf', '.jpg', '.png', '.gif', '.css', '.js'
        ]
      } = options;

      // Primeiro, extrair a página inicial
      const initialPage = await this.crawlSinglePage(baseUrl);
      const pages: CrawledPage[] = [initialPage];

      if (!initialPage.isValid) {
        return pages;
      }

      // Extrair links internos da página inicial
      const internalLinks = await this.extractInternalLinks(baseUrl);
      console.log(`🔗 Encontrados ${internalLinks.length} links internos`);

      // Filtrar links baseado nos padrões de exclusão
      const filteredLinks = internalLinks
        .filter(link => !excludePatterns.some(pattern => link.includes(pattern)))
        .slice(0, maxPages - 1); // -1 porque já temos a página inicial

      // Crawlear cada link interno
      for (const link of filteredLinks) {
        try {
          const page = await this.crawlSinglePage(link);
          pages.push(page);
          
          // Pequena pausa para não sobrecarregar o servidor
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn(`⚠️ Falha ao processar ${link}:`, error);
        }
      }

      // Filtrar apenas páginas válidas
      const validPages = pages.filter(page => page.isValid);
      console.log(`✅ Crawling concluído: ${validPages.length} páginas válidas de ${pages.length} tentativas`);

      return validPages;
    } catch (error) {
      console.error('❌ Erro no crawling do domínio:', error);
      return [];
    }
  }

  private async extractInternalLinks(baseUrl: string): Promise<string[]> {
    let page = null;
    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      const links = await page.evaluate((baseUrl) => {
        const domain = new URL(baseUrl).hostname;
        const linkElements = document.querySelectorAll('a[href]');
        const urls = new Set<string>();

        linkElements.forEach((link: any) => {
          const href = link.getAttribute('href');
          if (!href) return;

          try {
            let fullUrl: string;
            
            if (href.startsWith('http')) {
              const linkDomain = new URL(href).hostname;
              if (linkDomain === domain) {
                fullUrl = href;
              } else {
                return; // Skip external links
              }
            } else if (href.startsWith('/')) {
              fullUrl = new URL(href, baseUrl).href;
            } else if (href.startsWith('#') || href === '') {
              return; // Skip anchors and empty hrefs
            } else {
              fullUrl = new URL(href, baseUrl).href;
            }

            // Avoid duplicates and the base URL itself
            if (fullUrl !== baseUrl && !urls.has(fullUrl)) {
              urls.add(fullUrl);
            }
          } catch {
            // Invalid URL, skip
            return;
          }
        });

        return Array.from(urls);
      }, baseUrl);

      await page.close();
      return links;
    } catch (error) {
      if (page) {
        try {
          await page.close();
        } catch {}
      }
      console.error('❌ Erro ao extrair links internos:', error);
      return [];
    }
  }

  private cleanContent(html: string): string {
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, ' ');
    
    // Decode HTML entities
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');

    // Clean up whitespace
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return text;
  }

  private extractTitle(html: string): string | null {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  private getTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      
      if (path === '/' || path === '') {
        return urlObj.hostname;
      }
      
      const segments = path.split('/').filter(s => s.length > 0);
      const lastSegment = segments[segments.length - 1];
      
      return lastSegment
        .replace(/[-_]/g, ' ')
        .replace(/\.(html|php|asp|jsp)$/i, '')
        .replace(/\b\w/g, l => l.toUpperCase());
    } catch {
      return 'Página sem título';
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}