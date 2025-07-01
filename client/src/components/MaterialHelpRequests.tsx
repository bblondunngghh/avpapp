import { useState, useEffect } from "react";
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  Avatar, 
  IconButton, 
  Fab, 
  Badge,
  LinearProgress,
  Divider,
  Stack,
  Alert,
  AlertTitle
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon,
  Warning as WarningIcon,
  PersonPin as PersonPinIcon,
  AccessTime as AccessTimeIcon,
  Done as DoneIcon
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import rabbitRunningIcon from "@/assets/rabbit-running-icon.png";

// Material-UI Theme for Help Requests
const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#f50057',
      light: '#ff5983',
      dark: '#c51162',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.875rem',
    },
    body2: {
      fontSize: '0.75rem',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

// Countdown Timer Component
function CountdownTimer({ autoRemoveAt }: { autoRemoveAt: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const removeTime = new Date(autoRemoveAt).getTime();
      const difference = removeTime - now;

      if (difference > 0) {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft("0:00");
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [autoRemoveAt]);

  return (
    <span className="text-xs text-orange-600 font-medium">
      Auto-remove in: {timeLeft}
    </span>
  );
}

interface HelpRequest {
  id: number;
  requestingLocation: string;
  requestType: string;
  description: string;
  status: "active" | "fulfilled" | "completed";
  requestedAt: string;
  resolvedAt?: string | null;
  completedAt?: string | null;
  autoRemoveAt?: string | null;
}

interface HelpResponse {
  id: number;
  helpRequestId: number;
  respondingLocationName: string;
  message: string;
  respondedAt: string;
  status: string;
  completedAt?: string;
  attendantsOffered: string;
}

interface MaterialHelpRequestsProps {
  helpRequests: HelpRequest[];
  allResponses: HelpResponse[];
  isLoading: boolean;
  selectedRequestId: number | null;
  setSelectedRequestId: (id: number | null) => void;
  respondingLocation: string;
  setRespondingLocation: (location: string) => void;
  responseType: "help" | "busy";
  setResponseType: (type: "help" | "busy") => void;
  attendantsOffered: string;
  setAttendantsOffered: (count: string) => void;
  responseMessage: string;
  setResponseMessage: (message: string) => void;
  handleSubmitResponse: (requestId: number) => void;
  createResponseMutation: { isPending: boolean };
}

export function MaterialHelpRequests({
  helpRequests,
  allResponses,
  isLoading,
  selectedRequestId,
  setSelectedRequestId,
  respondingLocation,
  setRespondingLocation,
  responseType,
  setResponseType,
  attendantsOffered,
  setAttendantsOffered,
  responseMessage,
  setResponseMessage,
  handleSubmitResponse,
  createResponseMutation
}: MaterialHelpRequestsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return (
    <ThemeProvider theme={muiTheme}>
      <Box>
        <Typography variant="h6" sx={{ 
          mb: 2, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: '#374151',
          fontWeight: 600
        }}>
          <img src={rabbitRunningIcon} alt="Rabbit Running" style={{ height: '16px', width: '16px' }} />
          Active Help Requests
        </Typography>
        
        {isLoading ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading requests...
            </Typography>
          </Box>
        ) : helpRequests.length === 0 ? (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              textAlign: 'center', 
              bgcolor: '#f9fafb',
              border: '1px dashed #d1d5db'
            }}
          >
            <HelpIcon sx={{ fontSize: 48, color: '#9ca3af', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No active help requests at this time
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {helpRequests.map((request) => (
              <Paper 
                key={request.id} 
                elevation={2}
                sx={{ 
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid #e5e7eb',
                  '&:hover': {
                    boxShadow: 3,
                    borderColor: '#d1d5db'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ color: '#111827', fontWeight: 600, mb: 0.5 }}>
                      <Avatar sx={{ 
                        width: 24, 
                        height: 24, 
                        bgcolor: 'primary.main',
                        mr: 1,
                        display: 'inline-flex'
                      }}>
                        <PersonPinIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                      {request.requestingLocation}
                    </Typography>
                    <Chip 
                      label={request.requestType}
                      color="error"
                      size="small"
                      icon={<WarningIcon />}
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip 
                      label={new Date(request.requestedAt).toLocaleTimeString()}
                      size="small"
                      variant="outlined"
                      icon={<AccessTimeIcon />}
                      sx={{ fontSize: '0.7rem' }}
                    />
                    {request.status === "completed" && request.completedAt && request.autoRemoveAt && (
                      <Box sx={{ mt: 1 }}>
                        <CountdownTimer autoRemoveAt={request.autoRemoveAt} />
                      </Box>
                    )}
                  </Box>
                </Box>
            
                <Typography variant="body2" sx={{ color: '#6b7280', mb: 2, fontStyle: 'italic' }}>
                  {request.description}
                </Typography>
                
                {/* Responses with Material-UI Alert components */}
                <Stack spacing={1} sx={{ mb: 2 }}>
                  {allResponses
                    .filter(response => response.helpRequestId === request.id)
                    .map(response => (
                      <Alert 
                        key={response.id}
                        severity={response.status === 'completed' ? 'info' : 'success'}
                        variant="filled"
                        sx={{ 
                          borderRadius: 1,
                          fontSize: '0.875rem'
                        }}
                        icon={response.status === 'completed' ? <CheckCircleIcon /> : <NotificationsIcon />}
                      >
                        <AlertTitle sx={{ mb: 0.5, fontSize: '0.875rem', fontWeight: 600 }}>
                          {response.status === 'completed' 
                            ? `${response.respondingLocationName} attendants returning`
                            : `${response.respondingLocationName} dispatched ${response.attendantsOffered} attendant(s)`
                          }
                        </AlertTitle>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                          {response.message}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
                          {response.status === 'completed' 
                            ? `Completed at ${new Date(response.completedAt || response.respondedAt).toLocaleTimeString()}`
                            : `Dispatched at ${new Date(response.respondedAt).toLocaleTimeString()}`
                          }
                        </Typography>
                      </Alert>
                    ))}
                </Stack>
                
                {/* Response form and buttons */}
                {selectedRequestId === request.id ? (
                  <div className="space-y-4 bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-900">Respond to Help Request</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Location
                      </label>
                      <Select value={respondingLocation} onValueChange={setRespondingLocation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="The Capital Grille">The Capital Grille</SelectItem>
                          <SelectItem value="Bob's Steak and Chop House">Bob's Steak and Chop House</SelectItem>
                          <SelectItem value="Truluck's">Truluck's</SelectItem>
                          <SelectItem value="BOA Steakhouse">BOA Steakhouse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Response Type
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="help"
                            name="responseType"
                            value="help"
                            checked={responseType === "help"}
                            onChange={(e) => setResponseType(e.target.value as "help" | "busy")}
                            className="text-blue-600"
                          />
                          <label htmlFor="help" className="text-sm text-gray-700">
                            Help is on the way
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="busy"
                            name="responseType"
                            value="busy"
                            checked={responseType === "busy"}
                            onChange={(e) => setResponseType(e.target.value as "help" | "busy")}
                            className="text-blue-600"
                          />
                          <label htmlFor="busy" className="text-sm text-gray-700">
                            Too busy to send help
                          </label>
                        </div>
                      </div>
                    </div>

                    {responseType === "help" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Attendants Sending
                        </label>
                        <Select value={attendantsOffered} onValueChange={setAttendantsOffered}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select number" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 attendant</SelectItem>
                            <SelectItem value="2">2 attendants</SelectItem>
                            <SelectItem value="3">3 attendants</SelectItem>
                            <SelectItem value="4">4 attendants</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Message (Optional)
                      </label>
                      <Textarea
                        placeholder="Type any additional details..."
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => handleSubmitResponse(request.id)}
                        disabled={createResponseMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {createResponseMutation.isPending ? "Sending..." : "Send Response"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedRequestId(null);
                          setResponseMessage("");
                          setRespondingLocation("");
                          setAttendantsOffered("");
                          setResponseType("help");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedRequestId(request.id)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      Respond to {request.requestingLocation}
                    </Button>
                    
                    {allResponses.some(response => response.helpRequestId === request.id) && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={async () => {
                          try {
                            await apiRequest(`/help-requests/${request.id}/complete`, "PATCH");
                            queryClient.invalidateQueries({ queryKey: ["/api/help-requests/active"] });
                            queryClient.invalidateQueries({ queryKey: ["/api/help-responses/recent"] });
                            toast({
                              title: "Success",
                              description: "Help request marked as completed",
                              className: "bg-green-600 text-white",
                            });
                          } catch (error) {
                            console.error("Error marking as completed:", error);
                            toast({
                              title: "Error",
                              description: "Failed to mark as completed",
                              className: "bg-red-600 text-white",
                            });
                          }
                        }}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        Completed
                      </Button>
                    )}
                  </Box>
                )}
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </ThemeProvider>
  );
}