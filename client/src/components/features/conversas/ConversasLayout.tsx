import { useState, useEffect } from "react";
import { ConversationsSidebar } from "./ConversationsSidebar";
import { MainConversationArea } from "./MainConversationArea";
import { PatientInfoPanel } from "./PatientInfoPanel";
import { mockConversations, createTimelineItems, mockPatientInfo, conversationFilters } from "@/lib/mock-data";
import { Conversation, TimelineItem, PatientInfo } from "@/types/conversations";
import { cn } from "@/lib/utils";

export function ConversasLayout() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | undefined>();
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [currentPatientInfo, setCurrentPatientInfo] = useState<PatientInfo | undefined>();
  const [isMobile, setIsMobile] = useState(false);
  const [showPatientInfo, setShowPatientInfo] = useState(false);

  // Handle responsive layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleConversationSelect = (conversationId: number) => {
    setSelectedConversationId(conversationId);
    
    // Load timeline items for selected conversation
    const timeline = createTimelineItems(conversationId);
    setTimelineItems(timeline);
    
    // Load patient info (using mock data for now)
    setCurrentPatientInfo(mockPatientInfo);
    
    // On mobile, hide sidebar when conversation is selected
    if (isMobile) {
      setShowPatientInfo(false);
    }
  };

  const handleSendMessage = (message: string) => {
    // This would integrate with your backend API
    console.log("Sending message:", message);
  };

  if (isMobile) {
    return (
      <div className="h-screen bg-gray-50">
        {!selectedConversationId ? (
          // Mobile: Show conversations list
          <ConversationsSidebar
            conversations={mockConversations}
            selectedConversationId={selectedConversationId}
            onConversationSelect={handleConversationSelect}
            filters={conversationFilters}
          />
        ) : (
          // Mobile: Show conversation view
          <div className="h-full flex flex-col">
            <div className="flex items-center p-4 bg-white border-b">
              <button
                onClick={() => setSelectedConversationId(undefined)}
                className="mr-3 text-blue-600"
              >
                ← Voltar
              </button>
              <span className="font-medium">
                {mockConversations.find(c => c.id === selectedConversationId)?.patient_name}
              </span>
              <button
                onClick={() => setShowPatientInfo(!showPatientInfo)}
                className="ml-auto text-blue-600"
              >
                Info
              </button>
            </div>
            
            {showPatientInfo ? (
              <PatientInfoPanel patientInfo={currentPatientInfo} />
            ) : (
              <MainConversationArea
                timelineItems={timelineItems}
                patientInfo={currentPatientInfo}
                onSendMessage={handleSendMessage}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // Desktop and tablet layout
  return (
    <div className="h-screen flex bg-gray-50">
      {/* Conversations Sidebar */}
      <div className={cn(
        "border-r border-gray-200",
        "w-80 lg:w-96" // Responsive width
      )}>
        <ConversationsSidebar
          conversations={mockConversations}
          selectedConversationId={selectedConversationId}
          onConversationSelect={handleConversationSelect}
          filters={conversationFilters}
        />
      </div>

      {/* Main Conversation Area */}
      <div className="flex-1 min-w-0">
        <MainConversationArea
          timelineItems={timelineItems}
          patientInfo={currentPatientInfo}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* Patient Info Panel - Hidden on tablet, shown on desktop */}
      <div className={cn(
        "hidden xl:block w-80",
        "border-l border-gray-200"
      )}>
        <PatientInfoPanel patientInfo={currentPatientInfo} />
      </div>
    </div>
  );
}