import React, { useCallback, useMemo, useState } from 'react';
import { useParams, Link } from 'wouter';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Eye, 
  Edit3, 
  Settings, 
  Plus, 
  MoreVertical,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Custom Node Component
const FunilPageNode = ({ data }: { data: any }) => {
  const getStatusIcon = () => {
    switch (data.status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'draft':
        return <FileText className="h-4 w-4 text-orange-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getBorderColor = () => {
    switch (data.status) {
      case 'published':
        return 'border-green-300';
      case 'draft':
        return 'border-orange-300';
      case 'error':
        return 'border-red-300';
      default:
        return 'border-gray-300';
    }
  };

  const getStatusText = () => {
    switch (data.status) {
      case 'published':
        return 'Publicada';
      case 'draft':
        return 'Rascunho';
      case 'error':
        return 'Erro';
      default:
        return 'Rascunho';
    }
  };

  return (
    <Card className={`w-64 ${getBorderColor()} border-2 hover:shadow-lg transition-all duration-200 bg-white`}>
      <CardHeader className="pb-2">
        {/* Preview Thumbnail */}
        <div className="w-full h-32 bg-gray-100 rounded-md mb-3 flex items-center justify-center border">
          <div className="text-center text-gray-500">
            <FileText className="h-8 w-8 mx-auto mb-1" />
            <span className="text-xs">Preview</span>
          </div>
        </div>
        
        {/* Page Title and Status */}
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-900 truncate">
            {data.title}
          </CardTitle>
          {getStatusIcon()}
        </div>
        
        <div className="flex items-center justify-between">
          <Badge 
            variant="secondary" 
            className={`text-xs ${
              data.status === 'published' ? 'bg-green-100 text-green-800' :
              data.status === 'draft' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}
          >
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" className="p-1 h-8 w-8">
              <Edit3 className="h-4 w-4 text-blue-600" />
            </Button>
            <Button size="sm" variant="ghost" className="p-1 h-8 w-8">
              <Eye className="h-4 w-4 text-gray-600" />
            </Button>
            <Button size="sm" variant="ghost" className="p-1 h-8 w-8">
              <Settings className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="p-1 h-8 w-8">
                <MoreVertical className="h-4 w-4 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Duplicar</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

// Node types
const nodeTypes = {
  funilPage: FunilPageNode,
};

// Mock data for funnel
const mockFunilData = {
  id: "1",
  title: "Funil Cardiologia",
  description: "Captação de leads para consultas cardiológicas",
  pages: [
    {
      id: "page-1",
      title: "Landing Page",
      status: "published",
      type: "landing"
    },
    {
      id: "page-2", 
      title: "Sobre Nossos Serviços",
      status: "published",
      type: "content"
    },
    {
      id: "page-3",
      title: "Agendar Consulta",
      status: "draft",
      type: "form"
    },
    {
      id: "page-4",
      title: "Página de Obrigado",
      status: "published",
      type: "thank-you"
    }
  ]
};

export default function FunilDetalhes() {
  const { id } = useParams();

  // Create nodes from mock data
  const initialNodes: Node[] = useMemo(() => {
    return mockFunilData.pages.map((page, index) => ({
      id: page.id,
      type: 'funilPage',
      position: { x: index * 300, y: 100 },
      data: {
        title: page.title,
        status: page.status,
        type: page.type
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }));
  }, []);

  // Create edges to connect nodes
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    for (let i = 0; i < mockFunilData.pages.length - 1; i++) {
      edges.push({
        id: `edge-${i}`,
        source: mockFunilData.pages[i].id,
        target: mockFunilData.pages[i + 1].id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 },
      });
    }
    return edges;
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/funis">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{mockFunilData.title}</h1>
            <p className="text-sm text-gray-500">{mockFunilData.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Página
          </Button>
        </div>
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="top-right"
          className="bg-gray-50"
        >
          <Controls position="top-left" />
          <MiniMap 
            position="top-right"
            className="bg-white border border-gray-200 rounded-lg"
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Background gap={20} size={1} color="#e5e7eb" />
        </ReactFlow>
      </div>

      {/* Bottom Stats Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-6">
            <span>{mockFunilData.pages.length} páginas</span>
            <span>142 conversões este mês</span>
            <span>Taxa de conversão: 12.5%</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Zoom:</span>
            <Button size="sm" variant="ghost" className="px-2 h-7">−</Button>
            <Button size="sm" variant="ghost" className="px-2 h-7">100%</Button>
            <Button size="sm" variant="ghost" className="px-2 h-7">+</Button>
          </div>
        </div>
      </div>
    </div>
  );
}