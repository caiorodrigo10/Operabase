import React from "react";
import { useEditor } from "@craftjs/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

export const SettingsPanel = () => {
  const { actions, query, selected } = useEditor((state, query) => {
    const currentNodeId = query.getEvent('selected').last();
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings: state.nodes[currentNodeId].related && state.nodes[currentNodeId].related.settings,
        isDeletable: query.node(currentNodeId).isDeletable()
      };
    }

    return {
      selected
    };
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Propriedades
          {selected && (
            <Badge variant="secondary" className="text-xs">
              {selected.name}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selected ? (
          <>
            {selected.settings && React.createElement(selected.settings)}
            
            {selected.isDeletable && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  actions.delete(selected.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
          </>
        ) : (
          <div className="text-center text-sm text-gray-500 py-8">
            Selecione um elemento para editar suas propriedades
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Settings components for each user component
export const TextSettings = () => {
  const { actions, selected } = useEditor((state, query) => {
    const currentNodeId = query.getEvent('selected').last();
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        data: state.nodes[currentNodeId].data.props
      };
    }

    return {
      selected
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="text-content">Texto</Label>
        <Input
          id="text-content"
          value={selected.data.text || ''}
          onChange={(e) => 
            actions.setProp(selected.id, (props: any) => {
              props.text = e.target.value;
            })
          }
        />
      </div>
      
      <div>
        <Label htmlFor="font-size">Tamanho da Fonte</Label>
        <Slider
          value={[selected.data.fontSize || 16]}
          onValueChange={(value) =>
            actions.setProp(selected.id, (props: any) => {
              props.fontSize = value[0];
            })
          }
          max={48}
          min={12}
          step={1}
          className="mt-2"
        />
        <div className="text-xs text-gray-500 mt-1">{selected.data.fontSize || 16}px</div>
      </div>

      <div>
        <Label htmlFor="text-align">Alinhamento</Label>
        <Select
          value={selected.data.textAlign || 'left'}
          onValueChange={(value) =>
            actions.setProp(selected.id, (props: any) => {
              props.textAlign = value;
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Esquerda</SelectItem>
            <SelectItem value="center">Centro</SelectItem>
            <SelectItem value="right">Direita</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="text-color">Cor</Label>
        <Input
          id="text-color"
          type="color"
          value={selected.data.color || '#000000'}
          onChange={(e) =>
            actions.setProp(selected.id, (props: any) => {
              props.color = e.target.value;
            })
          }
        />
      </div>
    </div>
  );
};

export const ButtonSettings = () => {
  const { actions, selected } = useEditor((state, query) => {
    const currentNodeId = query.getEvent('selected').last();
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        data: state.nodes[currentNodeId].data.props
      };
    }

    return {
      selected
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="button-text">Texto do Botão</Label>
        <Input
          id="button-text"
          value={selected.data.children || ''}
          onChange={(e) => 
            actions.setProp(selected.id, (props: any) => {
              props.children = e.target.value;
            })
          }
        />
      </div>
      
      <div>
        <Label htmlFor="button-size">Tamanho</Label>
        <Select
          value={selected.data.size || 'default'}
          onValueChange={(value) =>
            actions.setProp(selected.id, (props: any) => {
              props.size = value;
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Pequeno</SelectItem>
            <SelectItem value="default">Médio</SelectItem>
            <SelectItem value="lg">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="button-variant">Estilo</Label>
        <Select
          value={selected.data.variant || 'default'}
          onValueChange={(value) =>
            actions.setProp(selected.id, (props: any) => {
              props.variant = value;
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Padrão</SelectItem>
            <SelectItem value="outline">Contorno</SelectItem>
            <SelectItem value="secondary">Secundário</SelectItem>
            <SelectItem value="ghost">Fantasma</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="bg-color">Cor de Fundo</Label>
        <Input
          id="bg-color"
          type="color"
          value={selected.data.backgroundColor || '#000000'}
          onChange={(e) =>
            actions.setProp(selected.id, (props: any) => {
              props.backgroundColor = e.target.value;
            })
          }
        />
      </div>

      <div>
        <Label htmlFor="text-color">Cor do Texto</Label>
        <Input
          id="text-color"
          type="color"
          value={selected.data.textColor || '#ffffff'}
          onChange={(e) =>
            actions.setProp(selected.id, (props: any) => {
              props.textColor = e.target.value;
            })
          }
        />
      </div>
    </div>
  );
};

export const ContainerSettings = () => {
  const { actions, selected } = useEditor((state, query) => {
    const currentNodeId = query.getEvent('selected').last();
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        data: state.nodes[currentNodeId].data.props
      };
    }

    return {
      selected
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="container-bg">Cor de Fundo</Label>
        <Input
          id="container-bg"
          type="color"
          value={selected.data.background || '#ffffff'}
          onChange={(e) =>
            actions.setProp(selected.id, (props: any) => {
              props.background = e.target.value;
            })
          }
        />
      </div>
      
      <div>
        <Label htmlFor="container-padding">Espaçamento Interno</Label>
        <Slider
          value={[selected.data.padding || 20]}
          onValueChange={(value) =>
            actions.setProp(selected.id, (props: any) => {
              props.padding = value[0];
            })
          }
          max={100}
          min={0}
          step={5}
          className="mt-2"
        />
        <div className="text-xs text-gray-500 mt-1">{selected.data.padding || 20}px</div>
      </div>
    </div>
  );
};