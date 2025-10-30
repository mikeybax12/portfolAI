const { useState, useEffect } = React;

// API Base URL - automatically detects environment
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : 'https://portfolai-production.up.railway.app/api';

// ============= API HELPERS =============

const getAuthToken = () => localStorage.getItem('authToken');

const setAuthToken = (token) => localStorage.setItem('authToken', token);

const clearAuthToken = () => localStorage.removeItem('authToken');

const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Only auto-reload if user had a token (expired session)
    // If no token, let the error propagate (invalid login)
    if (token) {
      clearAuthToken();
      window.location.reload();
      return;
    }
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
};

// AI Summary Generation
const generateAISummary = async (notes) => {
  try {
    const response = await apiCall('/claude', {
      method: 'POST',
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `You are a financial advisor's AI assistant. Below are meeting notes from a client meeting. Please provide:
1. A concise 2-3 sentence summary of what was discussed
2. The client's sentiment (positive, negative, or neutral)

Meeting Notes:
${notes}

Respond in this exact JSON format:
{
  "summary": "your summary here",
  "sentiment": "positive/negative/neutral"
}`
        }]
      })
    });

    console.log('Claude API Response:', response);

    if (!response || !response.content || !response.content[0]) {
      throw new Error('Invalid response from Claude API');
    }

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        summary: result.summary,
        sentiment: result.sentiment.toLowerCase()
      };
    }

    throw new Error('Failed to parse AI response');
  } catch (error) {
    console.error('AI API Error:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

// ============= AUTH COMPONENTS =============

const LoginForm = ({ onLogin, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      setAuthToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>PortfolAI ✨</h1>
          <p>Financial Advisor Notes & Client Management</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Welcome Back</h2>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Signing in...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i>
                Sign In
              </>
            )}
          </button>

          <div className="auth-switch">
            Don't have an account?
            <button type="button" onClick={onSwitchToSignup}>
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SignupForm = ({ onSignup, onSwitchToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password })
      });

      setAuthToken(data.token);
      onSignup(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>PortfolAI ✨</h1>
          <p>Financial Advisor Notes & Client Management</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Create Account</h2>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Creating account...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus"></i>
                Sign Up
              </>
            )}
          </button>

          <div className="auth-switch">
            Already have an account?
            <button type="button" onClick={onSwitchToLogin}>
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============= MODAL COMPONENT =============

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

// ============= CLIENT MODALS =============

const AddClientModal = ({ isOpen, onClose, onAddClient }) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (clientName.trim()) {
      setLoading(true);
      setError('');

      try {
        const client = await apiCall('/clients', {
          method: 'POST',
          body: JSON.stringify({
            name: clientName.trim(),
            phone: clientPhone.trim()
          })
        });

        onAddClient(client);
        setClientName('');
        setClientPhone('');
        onClose();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Client">
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message"><i className="fas fa-exclamation-circle"></i> {error}</div>}

        <div className="form-group">
          <label>Client Name:</label>
          <input
            type="text"
            placeholder="Enter client name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="form-group">
          <label>Phone Number:</label>
          <input
            type="tel"
            placeholder="(555) 123-4567"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Adding...</> : 'Add Client'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const EditClientModal = ({ isOpen, onClose, client, onUpdateClient, onDeleteClient }) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (client) {
      setClientName(client.name || '');
      setClientPhone(client.phone || '');
    }
  }, [client]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (clientName.trim()) {
      setLoading(true);
      setError('');

      try {
        const updatedClient = await apiCall(`/clients/${client.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: clientName.trim(),
            phone: clientPhone.trim()
          })
        });

        onUpdateClient(updatedClient);
        onClose();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${client.name}? This will also delete all associated meetings.`)) {
      setLoading(true);
      try {
        await apiCall(`/clients/${client.id}`, {
          method: 'DELETE'
        });
        onDeleteClient(client.id);
        onClose();
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
  };

  if (!client) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Client">
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message"><i className="fas fa-exclamation-circle"></i> {error}</div>}

        <div className="form-group">
          <label>Client Name:</label>
          <input
            type="text"
            placeholder="Enter client name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="form-group">
          <label>Phone Number:</label>
          <input
            type="tel"
            placeholder="(555) 123-4567"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
            <i className="fas fa-trash"></i> Delete Client
          </button>
          <div style={{ flex: 1 }}></div>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ============= MEETING MODALS =============

const ScheduleMeetingModal = ({ isOpen, onClose, clients, onScheduleMeeting, prefilledDate, prefilledClientId }) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [meetingDate, setMeetingDate] = useState(prefilledDate || new Date().toISOString().split('T')[0]);
  const [meetingTime, setMeetingTime] = useState('09:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (prefilledDate) {
      setMeetingDate(prefilledDate);
    }
  }, [prefilledDate]);

  useEffect(() => {
    if (prefilledClientId) {
      setSelectedClientId(prefilledClientId);
    }
  }, [prefilledClientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('=== ScheduleMeetingModal handleSubmit ===');
    console.log('selectedClientId:', selectedClientId, 'type:', typeof selectedClientId);
    console.log('meetingDate:', meetingDate);
    console.log('meetingTime:', meetingTime);

    if (selectedClientId) {
      setLoading(true);
      setError('');

      try {
        console.log('Making API call to:', `/clients/${selectedClientId}/scheduled-meetings`);
        const scheduledMeeting = await apiCall(`/clients/${selectedClientId}/scheduled-meetings`, {
          method: 'POST',
          body: JSON.stringify({
            date: meetingDate,
            time: meetingTime
          })
        });

        console.log('API response (scheduledMeeting):', scheduledMeeting);
        console.log('Calling onScheduleMeeting with clientId:', selectedClientId, 'meeting:', scheduledMeeting);
        onScheduleMeeting(selectedClientId, scheduledMeeting);
        setSelectedClientId('');
        setMeetingDate(new Date().toISOString().split('T')[0]);
        setMeetingTime('09:00');
        onClose();
      } catch (err) {
        console.error('Error scheduling meeting:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      console.log('No client selected!');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Meeting / Call">
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message"><i className="fas fa-exclamation-circle"></i> {error}</div>}

        <div className="form-group">
          <label>Select Client:</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            required
          >
            <option value="">Choose a client...</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Meeting Date:</label>
          <input
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Meeting Time:</label>
          <input
            type="time"
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
            required
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Scheduling...</>
            ) : (
              <><i className="fas fa-calendar-check"></i> Schedule</>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const AddMeetingModal = ({ isOpen, onClose, clients, onAddMeeting, onAddClient, prefilledDate }) => {
  const [isNewClient, setIsNewClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [meetingDate, setMeetingDate] = useState(prefilledDate || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (prefilledDate) {
      setMeetingDate(prefilledDate);
    }
  }, [prefilledDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsGenerating(true);

    try {
      let clientId = selectedClientId;

      // If new client, create them first
      if (isNewClient && newClientName.trim()) {
        const newClient = await apiCall('/clients', {
          method: 'POST',
          body: JSON.stringify({
            name: newClientName.trim(),
            phone: newClientPhone.trim()
          })
        });

        onAddClient(newClient);
        clientId = newClient.id;
      }

      if (clientId && notes.trim()) {
        // Generate AI summary
        const { summary, sentiment } = await generateAISummary(notes);

        // Save meeting
        const meeting = await apiCall(`/clients/${clientId}/meetings`, {
          method: 'POST',
          body: JSON.stringify({
            date: meetingDate,
            notes: notes.trim(),
            summary: summary,
            sentiment: sentiment
          })
        });

        onAddMeeting(clientId, meeting);

        // Reset form
        setIsNewClient(false);
        setSelectedClientId('');
        setNewClientName('');
        setNewClientPhone('');
        setNotes('');
        setMeetingDate(new Date().toISOString().split('T')[0]);
        onClose();
      } else {
        setError('Please select a client and enter notes.');
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      setError(err.message || 'Failed to generate AI summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Document Meeting / Call">
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            padding: '12px',
            background: 'var(--danger-50)',
            color: 'var(--danger-600)',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        <div className="form-group">
          <label>Client:</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                checked={!isNewClient}
                onChange={() => setIsNewClient(false)}
              />
              Existing Client
            </label>
            <label className="radio-label">
              <input
                type="radio"
                checked={isNewClient}
                onChange={() => setIsNewClient(true)}
              />
              New Client
            </label>
          </div>
        </div>

        {isNewClient ? (
          <>
            <div className="form-group">
              <label>Client Name:</label>
              <input
                type="text"
                placeholder="Enter client name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number:</label>
              <input
                type="tel"
                placeholder="(555) 123-4567"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="form-group">
            <label>Select Client:</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              required
            >
              <option value="">Choose a client...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Meeting Date:</label>
          <input
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Meeting Notes:</label>
          <textarea
            placeholder="Enter your notes here (bullets or paragraphs)&#10;- Portfolio review&#10;- Risk assessment&#10;- Client seemed happy with returns"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="8"
            required
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isGenerating}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Generating...
              </>
            ) : (
              <>
                <i className="fas fa-magic"></i> Generate & Save
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ============= CALENDAR COMPONENT =============

const Calendar = ({ clients, onShowScheduleMeeting }) => {
  console.log('=== Calendar render ===');
  console.log('clients prop:', clients);
  console.log('clients with scheduledMeetings:', clients.map(c => ({ id: c.id, name: c.name, scheduledMeetings: c.scheduledMeetings })));

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayDetails, setShowDayDetails] = useState(false);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getMeetingsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const meetings = [];

    clients.forEach(client => {
      // Get past meetings (with notes)
      if (client.meetings) {
        client.meetings.forEach(meeting => {
          const meetingDateStr = meeting.date.split('T')[0];
          if (meetingDateStr === dateStr) {
            meetings.push({
              ...meeting,
              clientName: client.name,
              clientId: client.id,
              type: 'past'
            });
          }
        });
      }

      // Get scheduled meetings (no notes yet)
      if (client.scheduledMeetings) {
        client.scheduledMeetings.forEach(meeting => {
          const meetingDateStr = meeting.date.split('T')[0];
          if (meetingDateStr === dateStr) {
            meetings.push({
              ...meeting,
              clientName: client.name,
              clientId: client.id,
              type: 'scheduled',
              sentiment: 'neutral'
            });
          }
        });
      }
    });

    return meetings;
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDayClick = (date) => {
    const meetings = getMeetingsForDate(date);
    if (meetings.length > 0) {
      setSelectedDate(date);
      setShowDayDetails(true);
    } else {
      // Quick schedule meeting for this date
      onShowScheduleMeeting(date.toISOString().split('T')[0]);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h3><i className="fas fa-calendar-alt"></i> Meeting Calendar</h3>
        <div className="calendar-nav">
          <button className="btn-calendar-nav" onClick={previousMonth} title="Previous Month">
            <i className="fas fa-chevron-left"></i>
          </button>
          <span className="calendar-month">{monthName}</span>
          <button className="btn-calendar-nav" onClick={nextMonth} title="Next Month">
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-days">
          {[...Array(startingDayOfWeek)].map((_, i) => (
            <div key={`empty-${i}`} className="calendar-day empty"></div>
          ))}
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const meetings = getMeetingsForDate(date);
            const isToday = new Date().toDateString() === date.toDateString();
            const hasMeetings = meetings.length > 0;

            return (
              <div
                key={day}
                className={`calendar-day ${isToday ? 'today' : ''} ${hasMeetings ? 'has-meetings' : ''}`}
                onClick={() => handleDayClick(date)}
              >
                <div className="calendar-day-number">{day}</div>
                {meetings.length > 0 && (
                  <div className="calendar-meetings">
                    <div className="meeting-count">{meetings.length} <i className="fas fa-users"></i></div>
                    <div className="calendar-meeting-indicators">
                      {meetings.slice(0, 3).map((meeting, idx) => (
                        <div
                          key={idx}
                          className={`calendar-meeting-dot sentiment-${meeting.sentiment}`}
                        ></div>
                      ))}
                      {meetings.length > 3 && <span className="more-meetings">+{meetings.length - 3}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showDayDetails && selectedDate && (
        <div className="day-details-modal">
          <div className="day-details-header">
            <h4>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h4>
            <button className="close-day-details" onClick={() => setShowDayDetails(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="day-details-meetings">
            {getMeetingsForDate(selectedDate).map((meeting, idx) => (
              <div key={idx} className="day-meeting-item">
                <div className="day-meeting-client">
                  <i className="fas fa-user"></i> {meeting.clientName}
                  {meeting.type === 'scheduled' && (
                    <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--primary-600)', fontWeight: '500' }}>
                      {meeting.time}
                    </span>
                  )}
                </div>
                {meeting.type === 'past' ? (
                  <>
                    <div className="day-meeting-summary">{meeting.summary}</div>
                    <span className={`sentiment-badge sentiment-${meeting.sentiment}`}>
                      {meeting.sentiment}
                    </span>
                  </>
                ) : (
                  <div className="day-meeting-summary" style={{ fontStyle: 'italic', color: 'var(--gray-500)' }}>
                    Scheduled - No notes yet
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="btn btn-primary calendar-add-btn" onClick={() => onShowScheduleMeeting(null)}>
        <i className="fas fa-plus"></i> Schedule Meeting
      </button>
    </div>
  );
};

// ============= STOCK MARKET WIDGET =============

const StockMarketWidget = () => {
  // Most relevant tickers for financial advisors
  const [stocks, setStocks] = useState([
    { symbol: 'SPY', name: 'S&P 500 ETF', price: 0, change: 0, changePercent: 0 },
    { symbol: 'QQQ', name: 'Nasdaq 100', price: 0, change: 0, changePercent: 0 },
    { symbol: 'DIA', name: 'Dow Jones', price: 0, change: 0, changePercent: 0 },
    { symbol: 'IWM', name: 'Russell 2000', price: 0, change: 0, changePercent: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [searchSymbol, setSearchSymbol] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);

        // Fetch real stock data from backend
        const updatedStocks = await Promise.all(
          stocks.map(async (stock) => {
            try {
              const data = await apiCall(`/stocks/${stock.symbol}`);
              return {
                ...stock,
                price: data.price.toFixed(2),
                change: data.change.toFixed(2),
                changePercent: data.changePercent.toFixed(2)
              };
            } catch (error) {
              console.error(`Error fetching ${stock.symbol}:`, error);
              // Return stock with current values on error
              return stock;
            }
          })
        );

        setStocks(updatedStocks);
        setLoading(false);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching stock data:', error);
        setLoading(false);
      }
    };

    fetchStockData();
    // Update every 5 minutes to conserve API credits (4 tickers * 12 updates/hour = 48 calls/hour)
    const interval = setInterval(fetchStockData, 300000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchSymbol.trim()) return;

    setSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const data = await apiCall(`/stocks/${searchSymbol.toUpperCase()}`);
      setSearchResult({
        symbol: searchSymbol.toUpperCase(),
        price: data.price.toFixed(2),
        change: data.change.toFixed(2),
        changePercent: data.changePercent.toFixed(2)
      });
    } catch (error) {
      setSearchError(`Could not find ticker "${searchSymbol.toUpperCase()}"`);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchSymbol('');
    setSearchResult(null);
    setSearchError('');
  };

  return (
    <div className="stock-widget">
      <div className="stock-header">
        <div>
          <h3><i className="fas fa-chart-line"></i> Market Overview</h3>
          <span className="last-update">
            Updated {lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <button className="btn-refresh" onClick={() => setLoading(true)} title="Refresh">
          <i className="fas fa-sync-alt"></i>
        </button>
      </div>

      <form onSubmit={handleSearch} className="stock-search-form">
        <div className="stock-search-input-wrapper">
          <input
            type="text"
            className="stock-search-input"
            placeholder="Search ticker (e.g., AAPL, TSLA)..."
            value={searchSymbol}
            onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
            maxLength="5"
          />
          {searchSymbol && (
            <button
              type="button"
              className="btn-clear-search"
              onClick={clearSearch}
              title="Clear search"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
          <button type="submit" className="btn-search" disabled={searching || !searchSymbol.trim()}>
            {searching ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
          </button>
        </div>
      </form>

      {searchError && (
        <div className="stock-search-error">
          <i className="fas fa-exclamation-circle"></i> {searchError}
        </div>
      )}

      {searchResult && (
        <div className="stock-search-result">
          <div className="stock-search-result-header">
            <span>Search Result:</span>
            <button className="btn-close-search" onClick={clearSearch} title="Close">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="stock-item stock-item-search">
            <div className="stock-symbol">{searchResult.symbol}</div>
            <div className="stock-price">${searchResult.price}</div>
            <div className={`stock-change ${parseFloat(searchResult.change) >= 0 ? 'positive' : 'negative'}`}>
              <i className={`fas fa-${parseFloat(searchResult.change) >= 0 ? 'arrow-up' : 'arrow-down'}`}></i>
              {parseFloat(searchResult.change) >= 0 ? '+' : ''}{searchResult.change} ({parseFloat(searchResult.changePercent) >= 0 ? '+' : ''}{searchResult.changePercent}%)
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="stock-loading">
          <i className="fas fa-spinner fa-spin"></i> Loading market data...
        </div>
      ) : (
        <div className="stocks-grid">
          {stocks.map(stock => (
            <div key={stock.symbol} className="stock-item">
              <div className="stock-symbol">{stock.symbol}</div>
              <div className="stock-name">{stock.name}</div>
              <div className="stock-price">${stock.price}</div>
              <div className={`stock-change ${parseFloat(stock.change) >= 0 ? 'positive' : 'negative'}`}>
                <i className={`fas fa-${parseFloat(stock.change) >= 0 ? 'arrow-up' : 'arrow-down'}`}></i>
                {parseFloat(stock.change) >= 0 ? '+' : ''}{stock.change} ({parseFloat(stock.changePercent) >= 0 ? '+' : ''}{stock.changePercent}%)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============= DASHBOARD COMPONENT =============

const Dashboard = ({ clients, onSelectClient, onShowDocumentMeeting, onShowAddClient, onShowEditClient, onShowScheduleMeeting }) => {
  const getLastMeetingDate = (client) => {
    if (!client.meetings || client.meetings.length === 0) return '-';
    const lastMeeting = client.meetings[client.meetings.length - 1];
    return new Date(lastMeeting.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getLastMeetingSentiment = (client) => {
    if (!client.meetings || client.meetings.length === 0) return null;
    const lastMeeting = client.meetings[client.meetings.length - 1];
    return lastMeeting.sentiment;
  };

  const getNextMeetingDate = (client) => {
    if (!client.scheduledMeetings || client.scheduledMeetings.length === 0) return '-';

    // Filter for future meetings and sort by date/time
    const now = new Date();
    const futureMeetings = client.scheduledMeetings
      .filter(meeting => {
        const meetingDateStr = meeting.date.split('T')[0];
        const meetingDateTime = new Date(`${meetingDateStr}T${meeting.time}`);
        return meetingDateTime > now;
      })
      .sort((a, b) => {
        const dateAStr = a.date.split('T')[0];
        const dateBStr = b.date.split('T')[0];
        const dateA = new Date(`${dateAStr}T${a.time}`);
        const dateB = new Date(`${dateBStr}T${b.time}`);
        return dateA - dateB;
      });

    if (futureMeetings.length === 0) return '-';

    const nextMeeting = futureMeetings[0];
    const meetingDate = new Date(nextMeeting.date);
    const formattedDate = meetingDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Format time from HH:MM:SS to h:MM AM/PM
    const timeParts = nextMeeting.time.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const formattedTime = `${displayHours}:${minutes} ${ampm}`;

    return `${formattedDate} at ${formattedTime}`;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="clients-section">
          <div className="section-header">
            <h2>Clients</h2>
            <div className="section-actions">
              <button className="btn btn-secondary" onClick={onShowAddClient}>
                <i className="fas fa-user-plus"></i> Add Client
              </button>
              <button className="btn btn-primary" onClick={() => onShowDocumentMeeting(null)}>
                <i className="fas fa-file-alt"></i> Document Meeting
              </button>
            </div>
          </div>
          <div className="table-container">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Phone</th>
                  <th>Last Meeting</th>
                  <th>Next Meeting</th>
                  <th>Last Sentiment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-row">
                      <div className="empty-state">
                        No clients yet. Click "Add Client" or "Document Meeting" to get started.
                      </div>
                    </td>
                  </tr>
                ) : (
                  clients.map(client => (
                    <tr key={client.id}>
                      <td className="client-name">{client.name}</td>
                      <td>{client.phone || '-'}</td>
                      <td>{getLastMeetingDate(client)}</td>
                      <td>{getNextMeetingDate(client)}</td>
                      <td>
                        {getLastMeetingSentiment(client) ? (
                          <span className={`sentiment-badge sentiment-${getLastMeetingSentiment(client)}`}>
                            {getLastMeetingSentiment(client)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-icon-view"
                            onClick={() => onSelectClient(client.id)}
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn-icon btn-icon-edit"
                            onClick={() => onShowEditClient(client)}
                            title="Edit Client"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="sidebar-section">
          <Calendar clients={clients} onShowScheduleMeeting={onShowScheduleMeeting} />
          <StockMarketWidget />
        </div>
      </div>
    </div>
  );
};

// ============= CLIENT VIEW COMPONENT =============

const ClientView = ({ client, onBack, onAddMeeting, onShowScheduleMeetingForClient }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateAndSave = async (e) => {
    e.preventDefault();
    setError('');
    setIsGenerating(true);

    try {
      if (notes.trim()) {
        // Generate AI summary
        const { summary, sentiment } = await generateAISummary(notes);

        // Save meeting
        const meeting = await apiCall(`/clients/${client.id}/meetings`, {
          method: 'POST',
          body: JSON.stringify({
            date: meetingDate,
            notes: notes.trim(),
            summary: summary,
            sentiment: sentiment
          })
        });

        onAddMeeting(client.id, meeting);

        setNotes('');
        setMeetingDate(new Date().toISOString().split('T')[0]);
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      setError(err.message || 'Failed to generate AI summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getSentimentBadgeClass = (sentiment) => {
    return `sentiment-badge sentiment-${sentiment}`;
  };

  // Get upcoming scheduled meetings (future dates)
  const today = new Date().toISOString().split('T')[0];
  const upcomingMeetings = (client.scheduledMeetings || [])
    .filter(meeting => meeting.date >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="client-view">
      <div className="client-header">
        <button className="btn btn-back" onClick={onBack}>
          <i className="fas fa-arrow-left"></i> Back to Clients
        </button>
        <h2>{client.name}</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onShowScheduleMeetingForClient}>
            <i className="fas fa-calendar-plus"></i> Schedule Meeting
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <i className="fas fa-plus"></i> {showAddForm ? 'Cancel' : 'Add Meeting Notes'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-meeting-form">
          <h3>Document Meeting Notes</h3>
          <form onSubmit={handleGenerateAndSave}>
            <div className="form-group">
              <label>Meeting Date:</label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Meeting Notes:</label>
              <textarea
                placeholder="Enter your notes here (bullets or paragraphs)&#10;- Portfolio review&#10;- Risk assessment&#10;- Client seemed happy with returns"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="8"
                required
              />
            </div>
            {error && (
              <div style={{
                padding: '12px',
                background: 'var(--danger-50)',
                color: 'var(--danger-600)',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-magic"></i> Generate & Save Summary
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {upcomingMeetings.length > 0 && (
        <div className="meetings-section" style={{ marginBottom: '32px' }}>
          <h3><i className="fas fa-calendar-alt"></i> Upcoming Meetings</h3>
          <div className="meetings-list">
            {upcomingMeetings.map((meeting, index) => (
              <div key={index} className="meeting-card" style={{ borderLeft: '4px solid var(--primary-500)' }}>
                <div className="meeting-header">
                  <span className="meeting-date">
                    <i className="fas fa-clock"></i> {new Date(meeting.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} at {meeting.time}
                  </span>
                  <span className="sentiment-badge" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                    Scheduled
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="meetings-section">
        <h3><i className="fas fa-history"></i> Meeting History</h3>
        {!client.meetings || client.meetings.length === 0 ? (
          <div className="empty-state">
            <p>No meetings recorded yet.</p>
          </div>
        ) : (
          <div className="meetings-list">
            {client.meetings.slice().reverse().map((meeting, index) => (
              <div key={index} className="meeting-card">
                <div className="meeting-header">
                  <span className="meeting-date">
                    {new Date(meeting.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <span className={getSentimentBadgeClass(meeting.sentiment)}>
                    {meeting.sentiment.charAt(0).toUpperCase() + meeting.sentiment.slice(1)}
                  </span>
                </div>
                <div className="meeting-summary">
                  <p><strong>AI Summary:</strong> {meeting.summary}</p>
                </div>
                <details className="meeting-notes">
                  <summary>View Original Notes</summary>
                  <pre>{meeting.notes}</pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============= MAIN APP COMPONENT =============

const App = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [showScheduleMeetingModal, setShowScheduleMeetingModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [prefilledMeetingDate, setPrefilledMeetingDate] = useState(null);
  const [prefilledClientId, setPrefilledClientId] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const userData = await apiCall('/auth/me');
          setUser(userData);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Auth check failed:', err);
          clearAuthToken();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Load clients when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadClients();
    }
  }, [isAuthenticated]);

  const loadClients = async () => {
    try {
      const clientsData = await apiCall('/clients');

      // Load meetings and scheduled meetings for each client
      const clientsWithData = await Promise.all(
        clientsData.map(async (client) => {
          try {
            const [meetings, scheduledMeetings] = await Promise.all([
              apiCall(`/clients/${client.id}/meetings`),
              apiCall(`/clients/${client.id}/scheduled-meetings`)
            ]);

            return {
              ...client,
              meetings: meetings || [],
              scheduledMeetings: scheduledMeetings || []
            };
          } catch (err) {
            console.error(`Error loading data for client ${client.id}:`, err);
            return {
              ...client,
              meetings: [],
              scheduledMeetings: []
            };
          }
        })
      );

      setClients(clientsWithData);
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleSignup = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleSignOut = () => {
    clearAuthToken();
    setUser(null);
    setIsAuthenticated(false);
    setClients([]);
    setSelectedClientId(null);
  };

  const handleAddClient = (client) => {
    setClients([...clients, { ...client, meetings: [], scheduledMeetings: [] }]);
  };

  const handleUpdateClient = (updatedClient) => {
    setClients(clients.map(client =>
      client.id === updatedClient.id
        ? { ...updatedClient, meetings: client.meetings, scheduledMeetings: client.scheduledMeetings }
        : client
    ));
  };

  const handleDeleteClient = (clientId) => {
    setClients(clients.filter(client => client.id !== clientId));
    if (selectedClientId === clientId) {
      setSelectedClientId(null);
    }
  };

  const handleAddMeeting = (clientId, meeting) => {
    setClients(clients.map(client => {
      if (client.id === parseInt(clientId)) {
        return {
          ...client,
          meetings: [...(client.meetings || []), meeting]
        };
      }
      return client;
    }));
  };

  const handleScheduleMeeting = (clientId, scheduledMeeting) => {
    console.log('=== handleScheduleMeeting called ===');
    console.log('clientId (param):', clientId, 'type:', typeof clientId);
    console.log('scheduledMeeting (param):', scheduledMeeting);
    console.log('Current clients:', clients);

    setClients(clients.map(client => {
      console.log('Checking client:', client.id, 'type:', typeof client.id, 'against clientId:', parseInt(clientId));
      if (client.id === parseInt(clientId)) {
        console.log('MATCH FOUND! Updating client:', client.id);
        console.log('Current scheduledMeetings:', client.scheduledMeetings);
        const updated = {
          ...client,
          scheduledMeetings: [...(client.scheduledMeetings || []), scheduledMeeting]
        };
        console.log('Updated client:', updated);
        console.log('New scheduledMeetings:', updated.scheduledMeetings);
        return updated;
      }
      return client;
    }));

    console.log('=== handleScheduleMeeting finished ===');
  };

  const handleShowAddMeeting = (date) => {
    setPrefilledMeetingDate(date);
    setShowAddMeetingModal(true);
  };

  const handleCloseMeetingModal = () => {
    setShowAddMeetingModal(false);
    setPrefilledMeetingDate(null);
  };

  const handleShowScheduleMeeting = (date, clientId = null) => {
    setPrefilledMeetingDate(date);
    setPrefilledClientId(clientId);
    setShowScheduleMeetingModal(true);
  };

  const handleCloseScheduleMeetingModal = () => {
    setShowScheduleMeetingModal(false);
    setPrefilledMeetingDate(null);
    setPrefilledClientId(null);
  };

  const handleShowAddClient = () => {
    setShowAddClientModal(true);
  };

  const handleCloseClientModal = () => {
    setShowAddClientModal(false);
  };

  const handleShowEditClient = (client) => {
    setEditingClient(client);
    setShowEditClientModal(true);
  };

  const handleCloseEditClientModal = () => {
    setShowEditClientModal(false);
    setEditingClient(null);
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return showLogin ? (
      <LoginForm
        onLogin={handleLogin}
        onSwitchToSignup={() => setShowLogin(false)}
      />
    ) : (
      <SignupForm
        onSignup={handleSignup}
        onSwitchToLogin={() => setShowLogin(true)}
      />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="logo">PortfolAI ✨</h1>
        </div>
        <div className="header-right">
          <span className="welcome-message">Welcome, {user?.fullName || 'User'}!</span>
          <button className="btn btn-secondary btn-signout" onClick={handleSignOut}>
            <i className="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      </header>

      <main className="app-main">
        {selectedClient ? (
          <ClientView
            client={selectedClient}
            onBack={() => setSelectedClientId(null)}
            onAddMeeting={handleAddMeeting}
            onShowScheduleMeetingForClient={() => handleShowScheduleMeeting(null, selectedClient.id)}
          />
        ) : (
          <Dashboard
            clients={clients}
            onSelectClient={setSelectedClientId}
            onShowAddClient={handleShowAddClient}
            onShowEditClient={handleShowEditClient}
            onShowScheduleMeeting={handleShowScheduleMeeting}
            onShowDocumentMeeting={handleShowAddMeeting}
          />
        )}
      </main>

      <AddClientModal
        isOpen={showAddClientModal}
        onClose={handleCloseClientModal}
        onAddClient={handleAddClient}
      />

      <EditClientModal
        isOpen={showEditClientModal}
        onClose={handleCloseEditClientModal}
        client={editingClient}
        onUpdateClient={handleUpdateClient}
        onDeleteClient={handleDeleteClient}
      />

      <ScheduleMeetingModal
        isOpen={showScheduleMeetingModal}
        onClose={handleCloseScheduleMeetingModal}
        clients={clients}
        onScheduleMeeting={handleScheduleMeeting}
        prefilledDate={prefilledMeetingDate}
        prefilledClientId={prefilledClientId}
      />

      <AddMeetingModal
        isOpen={showAddMeetingModal}
        onClose={handleCloseMeetingModal}
        clients={clients}
        onAddMeeting={handleAddMeeting}
        onAddClient={handleAddClient}
        prefilledDate={prefilledMeetingDate}
      />
    </div>
  );
};

// Render App
ReactDOM.render(<App />, document.getElementById('root'));
