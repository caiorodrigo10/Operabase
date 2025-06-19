import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppointmentForm } from "@/components/AppointmentForm";
import type { Contact } from "../../../server/domains/contacts/contacts.schema";

interface AppointmentEditorProps {
  appointmentId?: number;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (appointment: any) => void;
  preselectedContact?: Contact;
}

export function AppointmentEditor({ appointmentId, isOpen, onClose, onSave, preselectedContact }: AppointmentEditorProps) {
  const { toast } = useToast();
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [availabilityConflict, setAvailabilityConflict] = useState<any>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [workingHoursWarning, setWorkingHoursWarning] = useState<any>(null);

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const appointmentData = {
        contact_id: parseInt(data.contact_id),
        user_id: parseInt(data.user_id),
        clinic_id: 1,
        appointment_type: data.type,
        specialty: data.type,
        scheduled_date: `${data.scheduled_date} ${data.scheduled_time}:00`,
        duration_minutes: parseInt(data.duration),
        status: "agendada",
        session_notes: data.notes || null,
        tag_id: data.tag_id ? parseInt(data.tag_id) : null,
      };

      const response = await apiRequest('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        throw new Error('Failed to create appointment');
      }

      return response.json();
    },
    onSuccess: (appointment) => {
      toast({
        title: "Consulta agendada",
        description: "A consulta foi agendada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      if (onSave) onSave(appointment);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao agendar",
        description: error.message || "Ocorreu um erro ao agendar a consulta.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    createAppointmentMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar Nova Consulta</DialogTitle>
          <DialogDescription>
            Preencha os dados para agendar uma nova consulta. O sistema verificará automaticamente a disponibilidade.
          </DialogDescription>
        </DialogHeader>

        <AppointmentForm
          onSubmit={handleSubmit}
          isSubmitting={createAppointmentMutation.isPending}
          submitButtonText="Agendar Consulta"
          cancelButtonText="Cancelar"
          onCancel={onClose}
          preselectedContact={preselectedContact}
          showCancelButton={true}
          showFindTimeButton={true}
          setShowNewPatientDialog={setShowNewPatientDialog}
          availabilityConflict={availabilityConflict}
          isCheckingAvailability={isCheckingAvailability}
          workingHoursWarning={workingHoursWarning}
        />
      </DialogContent>
    </Dialog>
  );
}