import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Avatar,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Stack,
  MenuItem,
  Popper,
  ClickAwayListener,
  Paper as MenuPaper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
} from '@mui/material';
import {
  Send,
  ExitToApp,
  Person,
  Circle as StatusIcon,
  ArrowForward,
  Notifications,
  Settings,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  DeleteOutline,
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp, setDoc, getDocs, where, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import './Dashboard.css';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const AnalystColumn = ({ title, analysts, type, isAdmin, onDeleteAnalyst }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredAnalysts = analysts.filter(analyst => {
    if (!analyst) return false;
    const searchLower = searchTerm.toLowerCase();
    
    return (
      analyst.name?.toLowerCase().includes(searchLower) ||
      analyst.task?.toLowerCase().includes(searchLower) ||
      analyst.position?.toLowerCase().includes(searchLower) ||
      analyst.clients?.some(client => client.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Paper sx={{ 
      height: 'calc(100vh - 280px)',
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      bgcolor: type === 'active' ? 'rgba(220, 252, 231, 0.3)' : type === 'absent' ? 'rgba(254, 226, 226, 0.3)' : 'rgba(241, 245, 249, 0.3)',
    }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid',
        borderColor: type === 'active' ? 'success.light' : type === 'absent' ? 'error.light' : 'grey.300',
        bgcolor: type === 'active' ? 'rgba(220, 252, 231, 0.5)' : type === 'absent' ? 'rgba(254, 226, 226, 0.5)' : 'rgba(241, 245, 249, 0.5)',
      }}>
        <Typography sx={{ 
          fontSize: '1.1rem',
          fontWeight: 600,
          color: type === 'active' ? 'success.dark' : type === 'absent' ? 'error.dark' : 'text.secondary',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2
        }}>
          <StatusIcon sx={{ 
            fontSize: 10,
            color: type === 'active' ? 'success.main' : type === 'absent' ? 'error.main' : 'text.disabled'
          }} />
          {title} ({filteredAnalysts.length})
        </Typography>
        <TextField
          size="small"
          fullWidth
          placeholder="Buscar por nombre, cliente o tarea..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />,
            sx: {
              bgcolor: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0,0,0,0.1)',
              },
            }
          }}
        />
      </Box>
      <Droppable droppableId={type}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{ 
              flexGrow: 1, 
              overflow: 'auto',
              p: 2,
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '2px',
              },
              bgcolor: snapshot.isDraggingOver ? 'rgba(0, 0, 0, 0.02)' : 'transparent'
            }}
          >
            <Stack spacing={1.5}>
              {filteredAnalysts.map((analyst, index) => (
                <Draggable 
                  key={analyst.id} 
                  draggableId={analyst.id} 
                  index={index}
                  isDragDisabled={!isAdmin}
                >
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      sx={{ 
                        boxShadow: snapshot.isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
                        border: '1px solid',
                        borderColor: 'grey.200',
                        '&:hover': {
                          borderColor: type === 'active' ? 'success.light' : type === 'absent' ? 'error.light' : 'primary.light',
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                        },
                        cursor: isAdmin ? 'grab' : 'default',
                        '&:active': {
                          cursor: isAdmin ? 'grabbing' : 'default',
                        }
                      }}
                    >
                      <AnalystCard analyst={analyst} />
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Stack>
          </Box>
        )}
      </Droppable>
    </Paper>
  );
};

AnalystColumn.propTypes = {
  title: PropTypes.string.isRequired,
  analysts: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['active', 'absent', 'offline']).isRequired,
      task: PropTypes.string,
      avatar: PropTypes.string,
      coverBy: PropTypes.string,
      lastActive: PropTypes.string,
      lastSeen: PropTypes.string,
      reason: PropTypes.string,
    })
  ).isRequired,
  type: PropTypes.oneOf(['active', 'absent', 'offline']).isRequired,
  isAdmin: PropTypes.bool.isRequired,
  onDeleteAnalyst: PropTypes.func.isRequired
};

const AnalystCard = ({ analyst }) => (
  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar src={analyst.avatar} sx={{ width: 36, height: 36 }} />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 0.5 }}>
          {analyst.name}
          {analyst.interno && (
            <Typography 
              component="span" 
              variant="caption" 
              sx={{ ml: 1, color: 'text.secondary' }}
            >
              (Int. {analyst.interno})
            </Typography>
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          {analyst.position} • {analyst.startTime}-{analyst.endTime}
        </Typography>
        {analyst.task && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            {analyst.task}
          </Typography>
        )}
        {analyst.clients && analyst.clients.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
            {analyst.clients.map((client, idx) => (
              <Chip
                key={idx}
                label={client}
                size="small"
                variant="outlined"
                sx={{ 
                  height: 20, 
                  '& .MuiChip-label': { 
                    px: 1, 
                    fontSize: '0.7rem' 
                  } 
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  </CardContent>
);

AnalystCard.propTypes = {
  analyst: PropTypes.shape({
    name: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['active', 'absent', 'offline']).isRequired,
    task: PropTypes.string,
    avatar: PropTypes.string,
    coverBy: PropTypes.string,
    lastActive: PropTypes.string,
    lastSeen: PropTypes.string,
    reason: PropTypes.string,
  }).isRequired,
};

const ChatMessage = ({ message, isOwn, onDelete, onClientClick, onTypeClick, showSender }) => {
  const processedMessage = message.message?.replace(/@\w+|#\w+/g, '').trim();
  const hasOnlyTags = !processedMessage && (message.client || message.type);
  const [showDelete, setShowDelete] = useState(false);

  return (
    <Box sx={{ 
      mb: showSender ? 1 : 0.3,
      display: 'flex',
      flexDirection: 'column',
      alignItems: isOwn ? 'flex-end' : 'flex-start',
      width: '100%',
    }}>
      {showSender && (
        <Typography 
          variant="caption" 
          sx={{ 
            mb: 0.3,
            color: 'text.secondary',
            fontWeight: 500,
            pl: isOwn ? 0 : 1.5,
            fontSize: '0.7rem'
          }}
        >
          {message.sender}
        </Typography>
      )}
      <Box 
        onMouseEnter={() => setShowDelete(true)}
        onMouseLeave={() => setShowDelete(false)}
        sx={{ 
          maxWidth: '85%',
          minWidth: hasOnlyTags ? '100px' : 'auto',
          bgcolor: isOwn ? '#4285f4' : '#f0f2f5',
          borderRadius: hasOnlyTags ? '0.8rem' : 
            showSender ? '1.2rem' : 
            isOwn ? '1.2rem 0.3rem 1.2rem 1.2rem' : '0.3rem 1.2rem 1.2rem 1.2rem',
          p: hasOnlyTags ? 0.8 : '8px 12px',
          position: 'relative'
        }}
      >
        <Box sx={{ 
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          position: 'relative',
        }}>
          <Box sx={{ 
            flex: 1,
            minWidth: 0,
          }}>
            {processedMessage && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: isOwn ? 'white' : '#1a1a1a',
                  wordBreak: 'break-word',
                  fontSize: '0.85rem',
                  lineHeight: 1.4,
                  display: 'inline',
                  mr: 1
                }}
              >
                {processedMessage}
              </Typography>
            )}
          </Box>

          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            flexShrink: 0,
            position: 'relative',
            top: 2
          }}>
            <Typography 
              className="message-time"
              variant="caption" 
              sx={{ 
                fontSize: '0.7rem',
                color: isOwn ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                transition: 'transform 0.2s ease-in-out',
                transform: showDelete ? 'translateX(-24px)' : 'translateX(0)',
                whiteSpace: 'nowrap'
              }}
            >
              {message.time}
            </Typography>

            {isOwn && (
              <IconButton
                className="delete-button"
                size="small"
                onClick={() => onDelete(message.id)}
                sx={{ 
                  p: 0.2,
                  color: isOwn ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                  opacity: showDelete ? 1 : 0,
                  visibility: showDelete ? 'visible' : 'hidden',
                  position: 'absolute',
                  right: -8,
                  transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
                  '&:hover': {
                    color: isOwn ? 'white' : 'text.primary'
                  }
                }}
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        {(message.client || message.type) && (
          <Stack 
            direction="row" 
            spacing={0.5}
            sx={{ mt: 0.5 }}
          >
            {message.client && (
              <Chip
                size="small"
                label={message.client}
                onClick={() => onClientClick(message.client)}
                sx={{
                  height: 16,
                  bgcolor: isOwn ? 'rgba(255,255,255,0.25)' : '#e3f2fd',
                  color: isOwn ? 'white' : '#1565c0',
                  border: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: isOwn ? 'rgba(255,255,255,0.35)' : '#bbdefb',
                  },
                  '& .MuiChip-label': {
                    px: 0.8,
                    fontSize: '0.7rem',
                    fontWeight: 500
                  }
                }}
              />
            )}
            {message.type && (
              <Chip
                size="small"
                label={message.type}
                onClick={() => onTypeClick(message.type)}
                sx={{
                  height: 16,
                  bgcolor: isOwn ? 'rgba(255,255,255,0.15)' : '#f5f5f5',
                  color: isOwn ? 'white' : '#666666',
                  border: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: isOwn ? 'rgba(255,255,255,0.25)' : '#eeeeee',
                  },
                  '& .MuiChip-label': {
                    px: 0.8,
                    fontSize: '0.7rem',
                    fontWeight: 500
                  }
                }}
              />
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

ChatMessage.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string.isRequired,
    sender: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired,
    client: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
  isOwn: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onClientClick: PropTypes.func.isRequired,
  onTypeClick: PropTypes.func.isRequired,
  showSender: PropTypes.bool.isRequired,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [message, setMessage] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [mentionAnchorEl, setMentionAnchorEl] = useState(null);
  const [mentionType, setMentionType] = useState(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const textFieldRef = useRef(null);
  const chatEndRef = useRef(null);
  const [analysts, setAnalysts] = useState([]);
  const isAdmin = user?.email === 'lmirkin@gcgcontrol.com';
  const [filteredClient, setFilteredClient] = useState('');
  const [filteredType, setFilteredType] = useState('');
  const [clientMenuAnchorEl, setClientMenuAnchorEl] = useState(null);
  const [typeMenuAnchorEl, setTypeMenuAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [openAnnouncementDialog, setOpenAnnouncementDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    time: ''
  });
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: '',
    position: 'Analista',
    clients: [],
    interno: '',
    startTime: '',
    endTime: '',
    task: ''
  });
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  // Agregar estados para las columnas de analistas
  const [activeAnalysts, setActiveAnalysts] = useState([]);
  const [absentAnalysts, setAbsentAnalysts] = useState([]);
  const [offlineAnalysts, setOfflineAnalysts] = useState([]);

  useEffect(() => {
    // Clasificar analistas por estado
    const active = analysts.filter(a => a.status === 'active' || !a.status);
    const absent = analysts.filter(a => a.status === 'absent');
    const offline = analysts.filter(a => a.status === 'offline');
    
    setActiveAnalysts(active);
    setAbsentAnalysts(absent);
    setOfflineAnalysts(offline);
  }, [analysts]);

  const isFromToday = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const cleanOldMessages = async () => {
    try {
      const messagesRef = collection(db, 'messages');
      const snapshot = await getDocs(messagesRef);
      
      if (snapshot.docs.length > 0) {
        const updates = {};
        snapshot.docs.forEach((doc) => {
          const message = doc.data();
          if (!isFromToday(message.timestamp)) {
            updates[doc.id] = null;
          }
        });
        
        if (Object.keys(updates).length > 0) {
          await deleteDoc(doc(db, 'messages', Object.keys(updates)[0]));
        }
      }
    } catch (error) {
      console.error('Error al limpiar mensajes antiguos:', error);
    }
  };

  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow - now;

    const cleanupTimeout = setTimeout(cleanOldMessages, timeUntilMidnight);

    const dailyCleanup = setInterval(cleanOldMessages, 24 * 60 * 60 * 1000);

    return () => {
      clearTimeout(cleanupTimeout);
      clearInterval(dailyCleanup);
    };
  }, [cleanOldMessages]);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })).filter(msg => msg.timestamp);
      
      setChatMessages(messages);
      setLoading(false);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Actualizar estado del usuario actual
    const updateUserStatus = async () => {
      try {
        const userData = {
          id: user.uid,
          name: "Leonardo Mirkin",
          email: user.email,
          avatar: user.photoURL || '/avatars/default.jpg',
          status: 'active',
          interno: "105",
          clients: ["Coordinación"],
          lastActive: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          timestamp: serverTimestamp()
        };

        const userRef = doc(db, 'analysts', user.uid);
        await setDoc(userRef, userData, { merge: true });
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    };

    updateUserStatus();
    const interval = setInterval(updateUserStatus, 30000);

    // Listener para analistas con timestamp reciente
    const now = new Date();
    const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);

    const q = query(collection(db, 'analysts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const formattedAnalysts = snapshot.docs.map(doc => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate();
        // Marcar como offline si no hay actualización en los últimos 3 minutos
        if (timestamp && timestamp < threeMinutesAgo) {
          data.status = 'offline';
        }
        return {
          id: doc.id,
          ...data
        };
      });
      setAnalysts(formattedAnalysts);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
      if (user) {
        const userRef = doc(db, 'analysts', user.uid);
        setDoc(userRef, {
          status: 'offline',
          lastSeen: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          timestamp: serverTimestamp()
        }, { merge: true }).catch(error => console.error('Error in cleanup:', error));
      }
    };
  }, [user]);

  useEffect(() => {
    console.log('Configurando listener de comunicados...');
    
    const q = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Snapshot recibido');
      const formattedAnnouncements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() // Convertir timestamp a Date
      })).filter(ann => ann.timestamp); // Filtrar anuncios sin timestamp
      
      console.log('Comunicados formateados:', formattedAnnouncements);
      setAnnouncements(formattedAnnouncements);
    }, (error) => {
      console.error('Error al cargar comunicados:', error);
    });

    return () => {
      console.log('Limpiando listener de comunicados');
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const checkUserProfile = async () => {
      try {
        const userRef = doc(db, 'analysts', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          setIsFirstLogin(true);
          setOpenProfileDialog(true);
          setUserProfile({
            name: user.displayName || user.email,
            position: 'Analista', // Posición por defecto
            clients: [],
            interno: '',
            startTime: '',
            endTime: '',
            task: ''
          });
        } else {
          const data = userDoc.data();
          setUserProfile({
            name: data.name || user.displayName || user.email,
            position: data.position || 'Analista',
            clients: data.clients || [],
            interno: data.interno || '',
            startTime: data.startTime || '',
            endTime: data.endTime || '',
            task: data.task || ''
          });
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
      }
    };

    checkUserProfile();
  }, [user]);

  // Manejar cierre de pestaña o navegador
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = async () => {
      const userRef = doc(db, 'analysts', user.uid);
      await setDoc(userRef, {
        status: 'offline',
        lastSeen: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        timestamp: serverTimestamp()
      }, { merge: true });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [user]);

  const handleSendMessage = async () => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'messages'), {
        sender: user.displayName || user.email,
        message: message.trim(),
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        timestamp: serverTimestamp(),
        avatar: user.photoURL || '/avatars/default.jpg',
        client: selectedClient || null,
        type: selectedType || null,
        userId: user.uid
      });

      setMessage('');
      setSelectedClient('');
      setSelectedType('');
      textFieldRef.current?.focus();
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLogout = async () => {
    try {
      if (user) {
        const userRef = doc(db, 'analysts', user.uid);
        await setDoc(userRef, {
          status: 'offline',
          lastSeen: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          timestamp: serverTimestamp()
        }, { merge: true });
      }
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDragEnd = async (result) => {
    if (!isAdmin || !result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    try {
      const analystRef = doc(db, 'analysts', draggableId);
      const newStatus = destination.droppableId;
      
      await updateDoc(analystRef, {
        status: newStatus,
        lastModifiedBy: user.email,
        lastModifiedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating analyst status:', error);
    }
  };

  const messageTypes = [
    'Auditar Solicitud',
    'Comunicarse',
    'Mail',
    'Pasar llamado'
  ];

  const clients = [
    'Banco XYZ',
    'Seguros ABC',
    'Retail MNO',
    'Servicios PQR',
    'Industrias LMN'
  ];

  const handleMessageChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    setMessage(newValue);
    setCursorPosition(cursorPos);

    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    if (lastAtIndex !== -1 && lastAtIndex > lastHashIndex) {
      const query = textBeforeCursor.slice(lastAtIndex + 1);
      if (!query.includes(' ')) {
        setMentionType('client');
        setMentionAnchorEl(textFieldRef.current);
        return;
      }
    }
    
    if (lastHashIndex !== -1 && lastHashIndex > lastAtIndex) {
      const query = textBeforeCursor.slice(lastHashIndex + 1);
      if (!query.includes(' ')) {
        setMentionType('type');
        setMentionAnchorEl(textFieldRef.current);
        return;
      }
    }

    setMentionAnchorEl(null);
  };

  const handleMentionSelect = (value) => {
    const beforeCursor = message.slice(0, cursorPosition);
    const afterCursor = message.slice(cursorPosition);
    
    let lastSymbolIndex;
    if (mentionType === 'client') {
      lastSymbolIndex = beforeCursor.lastIndexOf('@');
      setSelectedClient(value);
    } else {
      lastSymbolIndex = beforeCursor.lastIndexOf('#');
      setSelectedType(value);
    }
    
    const newMessage = beforeCursor.slice(0, lastSymbolIndex) + 
                      (mentionType === 'client' ? `@${value}` : `#${value}`) + 
                      ' ' + afterCursor;
    
    setMessage(newMessage);
    setMentionAnchorEl(null);
  };

  const getFilteredSuggestions = () => {
    if (!mentionType) return [];
    
    const textBeforeCursor = message.slice(0, cursorPosition);
    const query = mentionType === 'client' 
      ? textBeforeCursor.slice(textBeforeCursor.lastIndexOf('@') + 1).toLowerCase()
      : textBeforeCursor.slice(textBeforeCursor.lastIndexOf('#') + 1).toLowerCase();

    const items = mentionType === 'client' ? clients : messageTypes;
    return items.filter(item => 
      item.toLowerCase().includes(query)
    );
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await deleteDoc(messageRef);
    } catch (error) {
      console.error('Error al eliminar mensaje:', error);
    }
  };

  const filteredMessages = chatMessages.filter(msg => {
    const matchesSearch = !searchQuery || 
      msg.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClient = !filteredClient || msg.client === filteredClient;
    const matchesType = !filteredType || msg.type === filteredType;
    return matchesSearch && matchesClient && matchesType;
  });

  const handleClientChipClick = (event) => {
    setClientMenuAnchorEl(event.currentTarget);
  };

  const handleTypeChipClick = (event) => {
    setTypeMenuAnchorEl(event.currentTarget);
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setClientMenuAnchorEl(null);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setTypeMenuAnchorEl(null);
  };

  const handleAddAnnouncement = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({
      title: '',
      content: '',
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    });
    setOpenAnnouncementDialog(true);
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      time: announcement.time
    });
    setOpenAnnouncementDialog(true);
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!user || !isAdmin) return;

    try {
      const docRef = doc(db, 'announcements', id);
      await deleteDoc(docRef);
      console.log('Comunicado eliminado:', id);
    } catch (error) {
      console.error('Error al eliminar comunicado:', error);
      alert('Error al eliminar el comunicado: ' + error.message);
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!user || !announcementForm.title.trim() || !announcementForm.content.trim()) {
      console.log('Validación fallida:', { user, form: announcementForm });
      return;
    }

    try {
      console.log('Iniciando guardado de comunicado...');
      const announcementData = {
        title: announcementForm.title.trim(),
        content: announcementForm.content.trim(),
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        timestamp: serverTimestamp(),
        createdBy: user.email,
        createdAt: new Date().toISOString()
      };

      console.log('Datos del comunicado:', announcementData);

      if (editingAnnouncement) {
        const docRef = doc(db, 'announcements', editingAnnouncement.id);
        await updateDoc(docRef, {
          ...announcementData,
          updatedAt: new Date().toISOString(),
          updatedBy: user.email
        });
      } else {
        await addDoc(collection(db, 'announcements'), announcementData);
      }

      console.log('Comunicado guardado exitosamente');
      setAnnouncementForm({
        title: '',
        content: '',
        time: ''
      });
      setEditingAnnouncement(null);
      setOpenAnnouncementDialog(false);
    } catch (error) {
      console.error('Error detallado al guardar comunicado:', error);
      alert('Error al guardar el comunicado: ' + error.message);
    }
  };

  const handleDeleteAnalyst = async (analystId) => {
    if (!isAdmin) return;
    
    try {
      const analystRef = doc(db, 'analysts', analystId);
      await deleteDoc(analystRef);
    } catch (error) {
      console.error('Error deleting analyst:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, 'analysts', user.uid);
      await setDoc(userRef, {
        ...userProfile,
        email: user.email,
        avatar: user.photoURL || '/avatars/default.jpg',
        status: 'active',
        lastActive: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        timestamp: serverTimestamp()
      }, { merge: true });

      setOpenProfileDialog(false);
      setIsFirstLogin(false);
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box sx={{ 
        display: 'flex', 
        height: '100vh',
        bgcolor: '#f1f5f9',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'rgba(0, 0, 0, 0.08)',
        borderRadius: '24px',
        m: 2,
        boxShadow: '0 0 1px rgba(0, 0, 0, 0.1), 0 2px 12px rgba(0, 0, 0, 0.08)',
        position: 'relative'
      }}>
        <Box sx={{ 
          width: 380, 
          borderRight: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)',
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'white',
          flexShrink: 0,
          height: '100%',
          position: 'sticky',
          left: 0,
          top: 0,
          boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
          borderTopLeftRadius: '24px',
          borderBottomLeftRadius: '24px',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'grey.200',
            bgcolor: '#4285f4',
          }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'white' }}>
              Chat del Equipo
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                size="small"
                placeholder="Buscar mensajes..."
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                  sx: {
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent'
                    }
                  }
                }}
              />
              <IconButton 
                size="small" 
                sx={{ 
                  bgcolor: 'white', 
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.9)' 
                  } 
                }}
                onClick={() => setSearchQuery('')}
                disabled={!searchQuery}
              >
                {searchQuery ? <ClearIcon /> : <FilterIcon />}
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                select
                size="small"
                fullWidth
                value={filteredClient}
                onChange={(e) => setFilteredClient(e.target.value)}
                placeholder="Filtrar por Cliente"
                SelectProps={{
                  displayEmpty: true,
                  renderValue: filteredClient ? undefined : () => "Filtrar por Cliente",
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#4285f4',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'white',
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.8)',
                      opacity: 1,
                    },
                  },
                }}
              >
                <MenuItem value="">Todos los clientes</MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client} value={client}>{client}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                fullWidth
                value={filteredType}
                onChange={(e) => setFilteredType(e.target.value)}
                placeholder="Filtrar por Tipo"
                SelectProps={{
                  displayEmpty: true,
                  renderValue: filteredType ? undefined : () => "Filtrar por Tipo",
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#4285f4',
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'transparent',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'white',
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.8)',
                      opacity: 1,
                    },
                  },
                }}
              >
                <MenuItem value="">Todos los tipos</MenuItem>
                {messageTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>
          <Box sx={{ 
            flexGrow: 1, 
            overflow: 'auto',
            p: 2,
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: '2px',
            }
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                {filteredMessages.map((msg, index) => {
                  const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
                  const showSender = !prevMessage || prevMessage.userId !== msg.userId;
                  
                  return (
                    <ChatMessage 
                      key={msg.id} 
                      message={msg} 
                      isOwn={msg.userId === user?.uid}
                      onDelete={handleDeleteMessage}
                      onClientClick={setFilteredClient}
                      onTypeClick={setFilteredType}
                      showSender={showSender}
                    />
                  );
                })}
                <div ref={chatEndRef} />
              </>
            )}
          </Box>
          <Box sx={{ 
            p: 2, 
            borderTop: '1px solid',
            borderColor: 'grey.200',
            bgcolor: 'white'
          }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Escribe un mensaje... Usa @ para mencionar un cliente y # para el tipo de mensaje"
              value={message}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              ref={textFieldRef}
              sx={{ mb: 1 }}
            />
            <Popper
              open={Boolean(mentionAnchorEl)}
              anchorEl={mentionAnchorEl}
              placement="top-start"
              style={{ zIndex: 1500 }}
            >
              <ClickAwayListener onClickAway={() => setMentionAnchorEl(null)}>
                <MenuPaper sx={{ 
                  p: 1,
                  maxHeight: 200,
                  overflow: 'auto',
                  width: 250,
                  boxShadow: '0px 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {getFilteredSuggestions().map((suggestion) => (
                    <MenuItem
                      key={suggestion}
                      onClick={() => handleMentionSelect(suggestion)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      {mentionType === 'client' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusinessIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                          {suggestion}
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssignmentIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                          {suggestion}
                        </Box>
                      )}
                    </MenuItem>
                  ))}
                </MenuPaper>
              </ClickAwayListener>
            </Popper>
            <Popper
              open={Boolean(clientMenuAnchorEl)}
              anchorEl={clientMenuAnchorEl}
              placement="top-start"
              style={{ zIndex: 1500 }}
            >
              <ClickAwayListener onClickAway={() => setClientMenuAnchorEl(null)}>
                <MenuPaper sx={{ 
                  p: 1,
                  maxHeight: 200,
                  overflow: 'auto',
                  width: 250,
                  boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
                  bgcolor: 'white'
                }}>
                  {clients.map((client) => (
                    <MenuItem
                      key={client}
                      onClick={() => handleClientSelect(client)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        '&:last-child': { mb: 0 },
                        '&:hover': {
                          bgcolor: 'rgba(66, 133, 244, 0.08)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon sx={{ fontSize: 16, color: '#4285f4' }} />
                        {client}
                      </Box>
                    </MenuItem>
                  ))}
                </MenuPaper>
              </ClickAwayListener>
            </Popper>
            <Popper
              open={Boolean(typeMenuAnchorEl)}
              anchorEl={typeMenuAnchorEl}
              placement="top-start"
              style={{ zIndex: 1500 }}
            >
              <ClickAwayListener onClickAway={() => setTypeMenuAnchorEl(null)}>
                <MenuPaper sx={{ 
                  p: 1,
                  maxHeight: 200,
                  overflow: 'auto',
                  width: 250,
                  boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
                  bgcolor: 'white'
                }}>
                  {messageTypes.map((type) => (
                    <MenuItem
                      key={type}
                      onClick={() => handleTypeSelect(type)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        '&:last-child': { mb: 0 },
                        '&:hover': {
                          bgcolor: 'rgba(66, 133, 244, 0.08)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignmentIcon sx={{ fontSize: 16, color: '#4285f4' }} />
                        {type}
                      </Box>
                    </MenuItem>
                  ))}
                </MenuPaper>
              </ClickAwayListener>
            </Popper>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  icon={<BusinessIcon sx={{ fontSize: 16, color: selectedClient ? '#4285f4' : 'text.secondary' }} />}
                  label={selectedClient || "Sin cliente"}
                  size="small"
                  onClick={handleClientChipClick}
                  onDelete={selectedClient ? () => setSelectedClient('') : undefined}
                  sx={{ 
                    height: 24,
                    cursor: 'pointer',
                    bgcolor: selectedClient ? 'rgba(66, 133, 244, 0.08)' : 'transparent',
                    color: selectedClient ? '#4285f4' : 'text.primary',
                    borderColor: selectedClient ? '#4285f4' : 'grey.300',
                    '&:hover': {
                      bgcolor: selectedClient ? 'rgba(66, 133, 244, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                />
                <Chip
                  icon={<AssignmentIcon sx={{ fontSize: 16, color: selectedType ? '#4285f4' : 'text.secondary' }} />}
                  label={selectedType || "Sin tipo"}
                  size="small"
                  onClick={handleTypeChipClick}
                  onDelete={selectedType ? () => setSelectedType('') : undefined}
                  sx={{ 
                    height: 24,
                    cursor: 'pointer',
                    bgcolor: selectedType ? 'rgba(66, 133, 244, 0.08)' : 'transparent',
                    color: selectedType ? '#4285f4' : 'text.primary',
                    borderColor: selectedType ? '#4285f4' : 'grey.300',
                    '&:hover': {
                      bgcolor: selectedType ? 'rgba(66, 133, 244, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                />
              </Box>
              <Button
                variant="contained"
                endIcon={<Send />}
                size="small"
                disabled={!message.trim() && !selectedClient && !selectedType}
                onClick={handleSendMessage}
                sx={{
                  bgcolor: '#4285f4',
                  '&:hover': {
                    bgcolor: '#3367d6'
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                Enviar
              </Button>
            </Box>
          </Box>
        </Box>

        <Box sx={{ 
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          position: 'relative'
        }}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3,
              position: 'sticky',
              top: 0,
              bgcolor: '#f1f5f9',
              zIndex: 1,
              py: 2
            }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 600,
                color: '#1e293b',
                fontSize: '1.5rem'
              }}>
                GCG CONTROL DOCUMENTAL
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton>
                  <Notifications />
                </IconButton>
                <IconButton>
                  <Settings />
                </IconButton>
                <Tooltip title="Editar perfil">
                  <IconButton onClick={() => setOpenProfileDialog(true)}>
                    <Avatar sx={{ bgcolor: '#4285f4' }}>
                      <Person />
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<ExitToApp />}
                  onClick={handleLogout}
                  sx={{ 
                    color: '#1e293b',
                    borderColor: '#1e293b',
                    '&:hover': {
                      borderColor: '#1e293b',
                      bgcolor: 'rgba(30, 41, 59, 0.04)'
                    }
                  }}
                >
                  Salir
                </Button>
              </Box>
            </Box>

            <Paper sx={{ 
              p: 2.5, 
              mb: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: '1px solid',
              borderColor: 'grey.200',
              bgcolor: 'white',
              borderRadius: '16px',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600,
                  fontSize: '1.25rem',
                  color: '#1e293b'
                }}>
                  Comunicados
                </Typography>
                {isAdmin && (
                  <Tooltip title="Agregar comunicado">
                    <IconButton onClick={handleAddAnnouncement} color="primary">
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Grid container spacing={2.5}>
                {announcements.length === 0 ? (
                  <Grid item xs={12}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 4,
                      color: 'text.secondary'
                    }}>
                      <Typography variant="body1">
                        No hay comunicados disponibles
                      </Typography>
                    </Box>
                  </Grid>
                ) : (
                  announcements.map((item) => (
                    <Grid item xs={12} md={4} key={item.id}>
                      <Card sx={{ 
                        boxShadow: 'none',
                        border: '1px solid',
                        borderColor: 'grey.200',
                        height: '100%',
                        borderRadius: '12px',
                        '&:hover': {
                          borderColor: 'primary.light',
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        }
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {item.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
                                {item.time}
                              </Typography>
                              {isAdmin && (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Editar">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleEditAnnouncement(item)}
                                      sx={{ color: 'primary.main' }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Eliminar">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleDeleteAnnouncement(item.id)}
                                      sx={{ color: 'error.main' }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              )}
                            </Box>
                          </Box>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {item.content}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            </Paper>

            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ 
                mb: 2.5,
                color: '#1e293b',
                fontWeight: 600
              }}>
                Estado de Analistas
                {isAdmin && (
                  <Chip
                    label="Modo Admin"
                    color="primary"
                    size="small"
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>
              <Grid container spacing={2} sx={{ p: 2, flexGrow: 1, height: 'calc(100vh - 64px)', overflow: 'auto' }}>
                <Grid item xs={4}>
                  <AnalystColumn
                    title="Activos"
                    analysts={activeAnalysts}
                    type="active"
                    isAdmin={isAdmin}
                    onDeleteAnalyst={handleDeleteAnalyst}
                  />
                </Grid>
                <Grid item xs={4}>
                  <AnalystColumn
                    title="Ausentes"
                    analysts={absentAnalysts}
                    type="absent"
                    isAdmin={isAdmin}
                    onDeleteAnalyst={handleDeleteAnalyst}
                  />
                </Grid>
                <Grid item xs={4}>
                  <AnalystColumn
                    title="Desconectados"
                    analysts={offlineAnalysts}
                    type="offline"
                    isAdmin={isAdmin}
                    onDeleteAnalyst={handleDeleteAnalyst}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Box>

        <Dialog 
          open={openAnnouncementDialog} 
          onClose={() => {
            setOpenAnnouncementDialog(false);
            setAnnouncementForm({
              title: '',
              content: '',
              time: ''
            });
            setEditingAnnouncement(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingAnnouncement ? 'Editar Comunicado' : 'Nuevo Comunicado'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Título"
                fullWidth
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                autoFocus
              />
              <TextField
                label="Contenido"
                fullWidth
                multiline
                rows={4}
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setOpenAnnouncementDialog(false);
                setAnnouncementForm({
                  title: '',
                  content: '',
                  time: ''
                });
                setEditingAnnouncement(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="contained"
              onClick={handleSaveAnnouncement}
              disabled={!announcementForm.title.trim() || !announcementForm.content.trim()}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={openProfileDialog} 
          onClose={() => !isFirstLogin && setOpenProfileDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {isFirstLogin ? 'Bienvenido! Complete su información' : 'Editar Perfil'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Nombre"
                fullWidth
                value={userProfile.name}
                onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                autoFocus
              />
              <TextField
                label="Interno"
                fullWidth
                required
                value={userProfile.interno}
                onChange={(e) => setUserProfile(prev => ({ ...prev, interno: e.target.value }))}
                helperText="Número de interno asignado"
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Hora de entrada"
                  fullWidth
                  required
                  type="time"
                  value={userProfile.startTime}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, startTime: e.target.value }))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300 // 5 minutos
                  }}
                />
                <TextField
                  label="Hora de salida"
                  fullWidth
                  required
                  type="time"
                  value={userProfile.endTime}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, endTime: e.target.value }))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300 // 5 minutos
                  }}
                />
              </Box>
              <TextField
                label="Puesto"
                fullWidth
                value={userProfile.position}
                onChange={(e) => setUserProfile(prev => ({ ...prev, position: e.target.value }))}
                disabled={!isAdmin} // Solo el admin puede cambiar el puesto
              />
              <TextField
                label="Tarea actual"
                fullWidth
                value={userProfile.task}
                onChange={(e) => setUserProfile(prev => ({ ...prev, task: e.target.value }))}
                helperText="Describe tu tarea o actividad actual"
              />
              <FormControl fullWidth required>
                <InputLabel>Clientes asignados</InputLabel>
                <Select
                  multiple
                  value={userProfile.clients}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, clients: e.target.value }))}
                  input={<OutlinedInput label="Clientes asignados" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={value}
                          onDelete={(e) => {
                            e.stopPropagation();
                            setUserProfile(prev => ({
                              ...prev,
                              clients: prev.clients.filter(client => client !== value)
                            }));
                          }}
                          sx={{
                            '& .MuiChip-deleteIcon': {
                              color: 'rgba(0, 0, 0, 0.26)',
                              '&:hover': {
                                color: 'error.main'
                              }
                            }
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300
                      }
                    }
                  }}
                >
                  {clients.map((client) => (
                    <MenuItem 
                      key={client} 
                      value={client}
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: 'rgba(66, 133, 244, 0.08)',
                          '&:hover': {
                            bgcolor: 'rgba(66, 133, 244, 0.12)'
                          }
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon sx={{ fontSize: 16, color: '#4285f4' }} />
                        {client}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            {!isFirstLogin && (
              <Button onClick={() => setOpenProfileDialog(false)}>
                Cancelar
              </Button>
            )}
            <Button 
              variant="contained"
              onClick={handleSaveProfile}
              disabled={!userProfile.name.trim() || 
                        !userProfile.interno.trim() || 
                        !userProfile.startTime || 
                        !userProfile.endTime || 
                        userProfile.clients.length === 0}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DragDropContext>
  );
};

export default Dashboard; 