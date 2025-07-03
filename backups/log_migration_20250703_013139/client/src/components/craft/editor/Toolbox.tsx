import React from "react";
import { useEditor, Element } from "@craftjs/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "../user/Text";
import { Button as CraftButton } from "../user/Button";
import { Container } from "../user/Container";

export const Toolbox = () => {
  const { connectors } = useEditor();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm">Elementos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-1 gap-2">
          <Button
            ref={(ref: HTMLButtonElement | null) => 
              ref && connectors.create(ref, <Text text="Texto de exemplo" />)
            }
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            📝 Texto
          </Button>
          
          <Button
            ref={(ref: HTMLButtonElement | null) => 
              ref && connectors.create(ref, <CraftButton>Botão</CraftButton>)
            }
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            🔘 Botão
          </Button>
          
          <Button
            ref={(ref: HTMLButtonElement | null) => 
              ref && connectors.create(ref, 
                <Element is={Container} canvas>
                  <Text text="Arraste elementos aqui" />
                </Element>
              )
            }
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            📦 Container
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};