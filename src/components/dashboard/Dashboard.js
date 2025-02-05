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
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp, setDoc, getDocs, where, getDoc, writeBatch } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import './Dashboard.css';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const AnalystColumn = ({ title, analysts, type, isAdmin, onDeleteAnalyst, onEditAnalyst }) => {
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
                      <AnalystCard 
                        analyst={analyst} 
                        isAdmin={isAdmin} 
                        onEdit={onEditAnalyst}
                      />
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
  onDeleteAnalyst: PropTypes.func.isRequired,
  onEditAnalyst: PropTypes.func.isRequired
};

const AnalystCard = ({ analyst, isAdmin, onEdit }) => {
  const handleEdit = () => {
    if (isAdmin && onEdit) {
      onEdit(analyst);
    }
  };

  return (
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar 
          src={analyst.photoURL || analyst.avatar} 
          alt={analyst.name}
          sx={{ 
            width: 36, 
            height: 36,
            border: '2px solid',
            borderColor: 'grey.200'
          }}
        >
          {!analyst.photoURL && !analyst.avatar && analyst.name?.[0]}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            {isAdmin && (
              <IconButton 
                size="small" 
                onClick={handleEdit}
                sx={{ ml: 1 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
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
};

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
  isAdmin: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired
};

const ChatMessage = ({ message, isOwn, onDelete, onClientClick, onTypeClick, showSender }) => {
  const [showDelete, setShowDelete] = useState(false);
  const hasOnlyTags = !message.message?.trim() && (message.client || message.type);

  const handleClientClick = () => {
    onClientClick(prev => ({ ...prev, client: message.client }));
  };

  const handleTypeClick = () => {
    onTypeClick(prev => ({ ...prev, type: message.type }));
  };

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
          position: 'relative',
          transform: isOwn && showDelete ? 'translateX(-24px)' : 'translateX(0)',
          transition: 'transform 0.2s ease-in-out',
        }}
      >
        {!hasOnlyTags && message.message?.trim() && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: isOwn ? 'white' : '#1a1a1a',
              wordBreak: 'break-word',
              fontSize: '0.85rem',
              lineHeight: 1.4,
              mb: (message.client || message.type) ? 0.5 : 0
            }}
          >
            {message.message.trim()}
          </Typography>
        )}

        {(message.client || message.type) && (
          <Stack 
            direction="row" 
            spacing={0.5}
            sx={{ mt: hasOnlyTags ? 0 : 0.5 }}
          >
            {message.client && (
              <Chip
                size="small"
                label={message.client}
                onClick={handleClientClick}
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
                onClick={handleTypeClick}
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

        {isOwn && (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            position: 'absolute',
            right: -24,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: showDelete ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
            pointerEvents: showDelete ? 'auto' : 'none',
          }}>
            <IconButton
              size="small"
              onClick={() => onDelete(message.id)}
              sx={{ 
                color: 'text.secondary',
                p: 0.2,
                '&:hover': {
                  color: 'error.main'
                }
              }}
            >
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Box>
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
  const [analysts, setAnalysts] = useState([]);
  const [localFilters, setLocalFilters] = useState({
    searchQuery: '',
    client: '',
    type: ''
  });
  const [clientMenuAnchorEl, setClientMenuAnchorEl] = useState(null);
  const [typeMenuAnchorEl, setTypeMenuAnchorEl] = useState(null);
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
    position: '',
    clients: [],
    interno: '',
    startTime: '',
    endTime: '',
    task: ''
  });
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [editingAnalyst, setEditingAnalyst] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [activeAnalysts, setActiveAnalysts] = useState([]);
  const [absentAnalysts, setAbsentAnalysts] = useState([]);
  const [offlineAnalysts, setOfflineAnalysts] = useState([]);

  const textFieldRef = useRef(null);
  const chatEndRef = useRef(null);
  const isAdmin = user?.email === 'lmirkin@gcgcontrol.com';

  useEffect(() => {
    if (!user) return;

    // Actualizar estado del usuario actual
    const updateUserStatus = async () => {
      try {
        const userData = {
          id: user.uid,
          name: userProfile.name || user.displayName || '',
          email: user.email,
          avatar: user.photoURL || '/avatars/default.jpg',
          status: 'active',
          interno: userProfile.interno || '',
          clients: userProfile.clients || [],
          position: userProfile.position || '',
          startTime: userProfile.startTime || '',
          endTime: userProfile.endTime || '',
          task: userProfile.task || '',
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
        const status = timestamp && timestamp < threeMinutesAgo ? 'offline' : data.status || 'active';
        return {
          id: doc.id,
          ...data,
          status
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
  }, [user, userProfile]);

  useEffect(() => {
    const active = analysts.filter(a => a.status === 'active');
    const absent = analysts.filter(a => a.status === 'absent');
    const offline = analysts.filter(a => a.status === 'offline');
    
    setActiveAnalysts(active);
    setAbsentAnalysts(absent);
    setOfflineAnalysts(offline);
  }, [analysts]);

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

    const userRef = doc(db, 'analysts', user.uid);
    
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const profileData = {
          name: data.name || user.displayName || '',
          position: data.position || '',
          clients: data.clients || [],
          interno: data.interno || '',
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          task: data.task || ''
        };
        
        setUserProfile(profileData);
        localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(profileData));
      } else {
        // Si el documento no existe, crear uno nuevo con datos básicos
        const initialData = {
          name: user.displayName || '',
          email: user.email,
          avatar: user.photoURL || '/avatars/default.jpg',
          status: 'active',
          timestamp: serverTimestamp()
        };
        setDoc(userRef, initialData);
      }
    });

    return () => unsubscribe();
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
    if (!user || (!message.trim() && !selectedClient && !selectedType)) return;

    try {
      await addDoc(collection(db, 'messages'), {
        sender: userProfile.name || user.displayName || user.email,
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
    'Auditar Solicitud/es',
    'Comunicarse',
    'Mail',
    'Pasar llamado',
    'Altas/Bajas',
    'Soporte',
  ];

  const clients = [
    'Aceitera General Deheza S.A.',
    'Andina Empaques Argentina S.A.',
    'Arcor S.A.I.C.',
    'Arcor S.A.I.C. Proveedores',
    'Arcor S.A.I.C. Transporte de Personas',
    'Arla Foods Ingredients SA',
    'Assist Cargo SA',
    'Bebidas y Alimentos de Uraba S.A.',
    'Bombas Grundfos de Argentina S.A.U.',
    'Cartocor Sociedad Anónima',
    'Ceibos Group',
    'Constructora Calchaqui S.A.',
    'Coca-Cola Andina Argentina',
    'Cosufi S.A.',
    'Cotagro Cooperativa Agropecuaria Limitada',
    'Danisco Argentina SA',
    'Distribuidora de Gas Cuyana S.A.',
    'Distribuidora de Gas del Centro S.A.',
    'Dos Anclas S.A.',
    'Establecimiento Las Marias S.A.C.I.F.A.',
    'Evonik Argentina S.A.',
    'Evonik Metilatos S.A.',
    'FCA Automobiles Argentina S.A.',
    'Ferrum',
    'FV SA',
    'GERDAU (Sipar Aceros)',
    'G P V Sociedad Anonima',
    'Helacor S.A.',
    'Industrias Guidi SACIF',
    'La Compañia Gaseosas Leticia S.A.S',
    'Las Taperitas SA',
    'MAHLE Argentina S.A.',
    'MAHLE Argentina S.A. Guarderia',
    'Tarjeta Naranja S.A.U',
    'Newsan Sociedad Anónima',
    'Ortiz y Cia. S.A.',
    'Palmar S.A.',
    'Paraguay Refrescos S.A.',
    'Parque Eólico Arauco S.A.P.E.M.',
    'Piedra Grande S.A.M.I.C.A. Y F.',
    'PB Leiner Argentina SA',
    'PB Leiner - Guarderías',
    'Petroquímica Rio Tercero S.A.',
    'Porta Hnos SA',
    'Pro De Man S.A',
    'Punta del Agua SA',
    'QX Logistica SA',
    'Reginald Lee S.A.',
    'Rosenarg S.R.L.',
    'Sancor Cooperativas Unidas Limitada',
    'Sancor RMP',
    'Scrapservice S.A.',
    'Seaboard Energías Renovables y Alimentos SRL',
    'Siderca S.A.I.C. (SIAT/SCRAP)',
    'Sodexo México S.A. De C.V',
    'Stratton Argentina S.A. (Konecta)',
    'Sucesores de Alfredo Williner S.A.',
    'Syngenta Agro S.A.- Servicios Agro',
    'Syngenta Agro S.A.- Parentales',
    'Tenaris Guarderia',
    'Ternium Argentina S.A.',
    'Veronica S.A.C.I.A.F.E.I.',
    'Vitopel Argentina SA',
    'Vientos de Arauco Renovables SAU',
    'Multicliente',
    'Embotelladora del Atlantico S.A.',

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
    if (mentionType === 'client') {
      setSelectedClient(value);
    } else {
      setSelectedType(value);
    }
    setMessage('');
    setMentionAnchorEl(null);
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setClientMenuAnchorEl(null);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setTypeMenuAnchorEl(null);
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
    const matchesSearch = !localFilters.searchQuery || 
      msg.message?.toLowerCase().includes(localFilters.searchQuery.toLowerCase()) ||
      msg.client?.toLowerCase().includes(localFilters.searchQuery.toLowerCase()) ||
      msg.type?.toLowerCase().includes(localFilters.searchQuery.toLowerCase());
    const matchesClient = !localFilters.client || msg.client === localFilters.client;
    const matchesType = !localFilters.type || msg.type === localFilters.type;
    return matchesSearch && matchesClient && matchesType;
  });

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

  const handleEditAnalyst = (analyst) => {
    if (!isAdmin) return;
    console.log('Editando analista:', analyst);
    setEditingAnalyst(analyst);
    setUserProfile({
      name: analyst.name || '',
      position: analyst.position || 'Analista',
      clients: analyst.clients || [],
      interno: analyst.interno || '',
      startTime: analyst.startTime || '',
      endTime: analyst.endTime || '',
      task: analyst.task || '',
      isAdmin: analyst.isAdmin || false
    });
    setOpenProfileDialog(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const targetRef = doc(db, 'analysts', editingAnalyst ? editingAnalyst.id : user.uid);
      const profileData = {
        name: userProfile.name,
        position: userProfile.position,
        clients: userProfile.clients || [],
        interno: userProfile.interno,
        startTime: userProfile.startTime,
        endTime: userProfile.endTime,
        task: userProfile.task,
        email: editingAnalyst ? editingAnalyst.email : user.email,
        avatar: editingAnalyst ? editingAnalyst.avatar : (user.photoURL || '/avatars/default.jpg'),
        status: editingAnalyst ? editingAnalyst.status : 'active',
        lastActive: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        timestamp: serverTimestamp(),
        lastModified: new Date().toISOString()
      };

      await setDoc(targetRef, profileData);
      console.log('Perfil guardado:', profileData);

      if (!editingAnalyst) {
        localStorage.setItem(`userProfile_${user.uid}`, JSON.stringify(userProfile));
      }

      setOpenProfileDialog(false);
      setIsFirstLogin(false);
      setEditingAnalyst(null);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  // Borrado automático a medianoche
  useEffect(() => {
    if (!user) return;

    const deleteAllMessages = async () => {
      try {
        const messagesRef = collection(db, 'messages');
        const snapshot = await getDocs(messagesRef);
        
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log('Mensajes eliminados automáticamente a medianoche');
      } catch (error) {
        console.error('Error al borrar mensajes:', error);
      }
    };

    // Calcular tiempo hasta la próxima medianoche
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = nextMidnight - now;

    // Programar el borrado para la medianoche
    const timeoutId = setTimeout(deleteAllMessages, msUntilMidnight);
    return () => clearTimeout(timeoutId);
  }, [user]);

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
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              mb: 2 
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                Chat del Equipo
              </Typography>
              {isAdmin && (
                <Tooltip title="Borrar todos los mensajes">
                  <IconButton
                    size="small"
                    onClick={() => setOpenDeleteDialog(true)}
                    sx={{ 
                      color: 'white',
                      ml: 1,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                size="small"
                placeholder="Buscar mensajes..."
                fullWidth
                value={localFilters.searchQuery}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
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
                onClick={() => setLocalFilters(prev => ({ ...prev, searchQuery: '' }))}
                disabled={!localFilters.searchQuery}
              >
                {localFilters.searchQuery ? <ClearIcon /> : <FilterIcon />}
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                select
                size="small"
                fullWidth
                value={localFilters.client}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, client: e.target.value }))}
                placeholder="Filtrar por Cliente"
                SelectProps={{
                  displayEmpty: true,
                  renderValue: localFilters.client ? undefined : () => "Filtrar por Cliente",
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
                value={localFilters.type}
                onChange={(e) => setLocalFilters(prev => ({ ...prev, type: e.target.value }))}
                placeholder="Filtrar por Tipo"
                SelectProps={{
                  displayEmpty: true,
                  renderValue: localFilters.type ? undefined : () => "Filtrar por Tipo",
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
                      onClientClick={setLocalFilters}
                      onTypeClick={setLocalFilters}
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
            <Box sx={{ position: 'relative' }}>
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
                modifiers={[
                  {
                    name: 'offset',
                    options: {
                      offset: [0, 8],
                    },
                  },
                  {
                    name: 'preventOverflow',
                    options: {
                      boundary: window,
                    },
                  },
                ]}
              >
                <ClickAwayListener onClickAway={() => setMentionAnchorEl(null)}>
                  <MenuPaper sx={{ 
                    p: 1,
                    maxHeight: 150,
                    overflow: 'auto',
                    minWidth: 200,
                    boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
                    bgcolor: 'white'
                  }}>
                    {getFilteredSuggestions().map((suggestion) => (
                      <MenuItem
                        key={suggestion}
                        onClick={() => handleMentionSelect(suggestion)}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          '&:last-child': { mb: 0 },
                          '&:hover': {
                            bgcolor: 'rgba(66, 133, 244, 0.08)'
                          }
                        }}
                      >
                        {mentionType === 'client' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BusinessIcon sx={{ fontSize: 16, color: '#4285f4' }} />
                            {suggestion}
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssignmentIcon sx={{ fontSize: 16, color: '#4285f4' }} />
                            {suggestion}
                          </Box>
                        )}
                      </MenuItem>
                    ))}
                  </MenuPaper>
                </ClickAwayListener>
              </Popper>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              position: 'relative',
              minHeight: 32
            }}>
              <Box sx={{ display: 'flex', gap: 1, flexGrow: 1, overflow: 'hidden' }}>
                <Box sx={{ position: 'relative', width: '50%' }}>
                  <Chip
                    icon={<BusinessIcon sx={{ fontSize: 16, color: selectedClient ? '#4285f4' : 'text.secondary' }} />}
                    label={selectedClient || "Sin cliente"}
                    size="small"
                    onClick={(e) => setClientMenuAnchorEl(e.currentTarget)}
                    onDelete={selectedClient ? () => setSelectedClient('') : undefined}
                    sx={{ 
                      height: 24,
                      width: '100%',
                      cursor: 'pointer',
                      bgcolor: selectedClient ? 'rgba(66, 133, 244, 0.08)' : 'transparent',
                      color: selectedClient ? '#4285f4' : 'text.primary',
                      borderColor: selectedClient ? '#4285f4' : 'grey.300',
                      '&:hover': {
                        bgcolor: selectedClient ? 'rgba(66, 133, 244, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  />
                  <Popper
                    open={Boolean(clientMenuAnchorEl)}
                    anchorEl={clientMenuAnchorEl}
                    placement="top-start"
                    style={{ zIndex: 1500 }}
                    modifiers={[
                      {
                        name: 'offset',
                        options: {
                          offset: [0, 8],
                        },
                      },
                      {
                        name: 'preventOverflow',
                        options: {
                          boundary: window,
                        },
                      },
                    ]}
                  >
                    <ClickAwayListener onClickAway={() => setClientMenuAnchorEl(null)}>
                      <MenuPaper sx={{ 
                        p: 1,
                        maxHeight: 150,
                        overflow: 'auto',
                        minWidth: 200,
                        boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
                        bgcolor: 'white'
                      }}>
                        {clients.map((client) => (
                          <MenuItem
                            key={client}
                            onClick={() => {
                              // Cerrar el desplegable después de seleccionar
                              const select = document.activeElement;
                              if (select) {
                                select.blur();
                              }
                              handleClientSelect(client);
                            }}
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
                      </MenuPaper>
                    </ClickAwayListener>
                  </Popper>
                </Box>
                <Box sx={{ position: 'relative', width: '50%' }}>
                  <Chip
                    icon={<AssignmentIcon sx={{ fontSize: 16, color: selectedType ? '#4285f4' : 'text.secondary' }} />}
                    label={selectedType || "Sin tipo"}
                    size="small"
                    onClick={(e) => setTypeMenuAnchorEl(e.currentTarget)}
                    onDelete={selectedType ? () => setSelectedType('') : undefined}
                    sx={{ 
                      height: 24,
                      width: '100%',
                      cursor: 'pointer',
                      bgcolor: selectedType ? 'rgba(66, 133, 244, 0.08)' : 'transparent',
                      color: selectedType ? '#4285f4' : 'text.primary',
                      borderColor: selectedType ? '#4285f4' : 'grey.300',
                      '&:hover': {
                        bgcolor: selectedType ? 'rgba(66, 133, 244, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  />
                  <Popper
                    open={Boolean(typeMenuAnchorEl)}
                    anchorEl={typeMenuAnchorEl}
                    placement="top-start"
                    style={{ zIndex: 1500 }}
                    modifiers={[
                      {
                        name: 'offset',
                        options: {
                          offset: [0, 8],
                        },
                      },
                      {
                        name: 'preventOverflow',
                        options: {
                          boundary: window,
                        },
                      },
                    ]}
                  >
                    <ClickAwayListener onClickAway={() => setTypeMenuAnchorEl(null)}>
                      <MenuPaper sx={{ 
                        p: 1,
                        maxHeight: 150,
                        overflow: 'auto',
                        minWidth: 200,
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
                </Box>
              </Box>
              <Box sx={{ ml: 2, flexShrink: 0 }}>
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
                    onEditAnalyst={handleEditAnalyst}
                  />
                </Grid>
                <Grid item xs={4}>
                  <AnalystColumn
                    title="Ausentes"
                    analysts={absentAnalysts}
                    type="absent"
                    isAdmin={isAdmin}
                    onDeleteAnalyst={handleDeleteAnalyst}
                    onEditAnalyst={handleEditAnalyst}
                  />
                </Grid>
                <Grid item xs={4}>
                  <AnalystColumn
                    title="Desconectados"
                    analysts={offlineAnalysts}
                    type="offline"
                    isAdmin={isAdmin}
                    onDeleteAnalyst={handleDeleteAnalyst}
                    onEditAnalyst={handleEditAnalyst}
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
                value={userProfile.name || ''}
                onChange={(e) => setUserProfile(prev => ({...prev, name: e.target.value}))}
                autoFocus
              />
              <TextField
                label="Interno"
                fullWidth
                required
                value={userProfile.interno || ''}
                onChange={(e) => setUserProfile(prev => ({...prev, interno: e.target.value}))}
                helperText="Número de interno asignado"
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Hora de entrada"
                  fullWidth
                  required
                  type="time"
                  defaultValue="00:00"
                  value={userProfile.startTime || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setUserProfile(prev => ({
                      ...prev,
                      startTime: newValue
                    }));
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  label="Hora de salida"
                  fullWidth
                  required
                  type="time"
                  defaultValue="00:00"
                  value={userProfile.endTime || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setUserProfile(prev => ({
                      ...prev,
                      endTime: newValue
                    }));
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Box>
              <TextField
                label="Puesto"
                fullWidth
                value={userProfile.position || ''}
                onChange={(e) => setUserProfile(prev => ({...prev, position: e.target.value}))}
                disabled={!isAdmin}
              />
              <TextField
                label="Tarea actual"
                fullWidth
                value={userProfile.task || ''}
                onChange={(e) => setUserProfile(prev => ({...prev, task: e.target.value}))}
                helperText="Describe tu tarea o actividad actual"
              />
              <FormControl fullWidth required>
                <InputLabel>Clientes asignados</InputLabel>
                <Select
                  multiple
                  value={userProfile.clients || []}
                  onChange={(e) => {
                    const newClients = e.target.value;
                    setUserProfile(prev => ({
                      ...prev,
                      clients: newClients
                    }));
                  }}
                  input={<OutlinedInput label="Clientes asignados" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={value}
                          onDelete={(e) => {
                            e.stopPropagation();
                            const newClients = userProfile.clients.filter(c => c !== value);
                            setUserProfile(prev => ({
                              ...prev,
                              clients: newClients
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

        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            Confirmar borrado de mensajes
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2">
                ¿Está seguro que desea borrar todos los mensajes del chat?
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={async () => {
                try {
                  const messagesRef = collection(db, 'messages');
                  const snapshot = await getDocs(messagesRef);
                  
                  const batch = writeBatch(db);
                  snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                  });
                  
                  await batch.commit();
                  setOpenDeleteDialog(false);
                } catch (error) {
                  console.error('Error al eliminar mensajes:', error);
                }
              }}
            >
              Confirmar borrado
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DragDropContext>
  );
};

export default Dashboard; 