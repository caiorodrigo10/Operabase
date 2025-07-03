#!/bin/bash

# 🧹 Script de Migração de Logs - Operabase
# Migra console.log para structured logging

set -e

echo "🧹 Iniciando migração de logs para structured logging..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logs coloridos
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos na raiz do projeto
if [ ! -f "package.json" ]; then
    log_error "Execute este script na raiz do projeto Operabase"
    exit 1
fi

# Função para backup
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="backups/log_migration_$timestamp"
    
    log_info "Criando backup em $backup_dir..."
    mkdir -p "$backup_dir"
    
    # Backup server
    if [ -d "server" ]; then
        cp -r server "$backup_dir/"
        log_success "Backup do server criado"
    fi
    
    # Backup client
    if [ -d "client" ]; then
        cp -r client "$backup_dir/"
        log_success "Backup do client criado"
    fi
    
    echo "$backup_dir" > .last_backup_path
    log_success "Backup completo criado em: $backup_dir"
}

# Função para contar logs atuais
count_logs() {
    local total_console=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -E "(client|server)" | xargs grep -c "console\." 2>/dev/null | awk -F: '{sum += $2} END {print sum}')
    echo "$total_console"
}

# Função para migrar arquivo específico
migrate_file() {
    local file="$1"
    local temp_file="${file}.tmp"
    
    log_info "Migrando: $file"
    
    # Verificar se já tem import do Logger
    if ! grep -q "import.*Logger.*from.*shared/logger" "$file" 2>/dev/null; then
        # Adicionar import do Logger no topo do arquivo
        sed '1i\
import { Logger } from "../../shared/logger.js";' "$file" > "$temp_file"
        mv "$temp_file" "$file"
    fi
    
    # Substituições básicas
    sed -i '' \
        -e 's/console\.log(/Logger.debug(/g' \
        -e 's/console\.error(/Logger.error(/g' \
        -e 's/console\.warn(/Logger.warn(/g' \
        -e 's/console\.info(/Logger.info(/g' \
        "$file"
    
    log_success "Arquivo migrado: $file"
}

# Função para migrar diretório
migrate_directory() {
    local dir="$1"
    local pattern="$2"
    
    log_info "Migrando diretório: $dir"
    
    find "$dir" -name "$pattern" -type f | while read -r file; do
        # Pular arquivos de exemplo e teste
        if [[ "$file" == *"example"* ]] || [[ "$file" == *"test"* ]] || [[ "$file" == *".test."* ]]; then
            continue
        fi
        
        # Verificar se tem console.log
        if grep -q "console\." "$file" 2>/dev/null; then
            migrate_file "$file"
        fi
    done
}

# Função para validar migração
validate_migration() {
    log_info "Validando migração..."
    
    local remaining_logs=$(count_logs)
    log_info "Logs restantes: $remaining_logs"
    
    # Verificar se há erros de sintaxe
    if command -v tsc &> /dev/null; then
        log_info "Verificando sintaxe TypeScript..."
        if ! tsc --noEmit --skipLibCheck; then
            log_warning "Encontrados erros de sintaxe TypeScript"
            return 1
        fi
    fi
    
    log_success "Validação concluída"
    return 0
}

# Função para rollback
rollback() {
    if [ -f ".last_backup_path" ]; then
        local backup_dir=$(cat .last_backup_path)
        log_warning "Fazendo rollback para: $backup_dir"
        
        if [ -d "$backup_dir/server" ]; then
            rm -rf server
            cp -r "$backup_dir/server" .
        fi
        
        if [ -d "$backup_dir/client" ]; then
            rm -rf client
            cp -r "$backup_dir/client" .
        fi
        
        log_success "Rollback concluído"
    else
        log_error "Nenhum backup encontrado para rollback"
        exit 1
    fi
}

# Função principal
main() {
    local mode="${1:-migrate}"
    
    case "$mode" in
        "count")
            local total=$(count_logs)
            log_info "Total de console statements: $total"
            ;;
        "backup")
            create_backup
            ;;
        "migrate")
            log_info "Iniciando migração completa..."
            
            # Contar logs antes
            local before=$(count_logs)
            log_info "Logs antes da migração: $before"
            
            # Criar backup
            create_backup
            
            # Migrar server-side (prioridade alta)
            if [ -d "server/domains" ]; then
                migrate_directory "server/domains" "*.ts"
            fi
            
            if [ -d "server/shared" ]; then
                migrate_directory "server/shared" "*.ts"
            fi
            
            if [ -d "server/services" ]; then
                migrate_directory "server/services" "*.ts"
            fi
            
            # Migrar client-side (prioridade média)
            if [ -d "client/src/pages" ]; then
                migrate_directory "client/src/pages" "*.tsx"
            fi
            
            if [ -d "client/src/components" ]; then
                migrate_directory "client/src/components" "*.tsx"
            fi
            
            # Contar logs depois
            local after=$(count_logs)
            log_info "Logs após migração: $after"
            
            # Calcular redução
            local reduction=$((before - after))
            local percentage=$((reduction * 100 / before))
            
            log_success "Migração concluída!"
            log_success "Redução: $reduction logs ($percentage%)"
            
            # Validar migração
            if ! validate_migration; then
                log_error "Validação falhou. Considere fazer rollback."
                exit 1
            fi
            ;;
        "rollback")
            rollback
            ;;
        "validate")
            validate_migration
            ;;
        *)
            echo "Uso: $0 [count|backup|migrate|rollback|validate]"
            echo ""
            echo "Comandos:"
            echo "  count     - Contar console statements atuais"
            echo "  backup    - Criar backup dos arquivos"
            echo "  migrate   - Migrar logs (inclui backup)"
            echo "  rollback  - Restaurar último backup"
            echo "  validate  - Validar migração atual"
            echo ""
            echo "Exemplo:"
            echo "  $0 count"
            echo "  $0 migrate"
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@" 