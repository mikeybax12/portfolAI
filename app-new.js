const { useState, useEffect } = React;

// API Base URL
const API_URL = 'http://localhost:3001/api';

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
        model: 'claude-3-5-sonnet-20241022',
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
          <h1>PortfolAI <i className="fas fa-sparkles"></i></h1>
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
          <h1>PortfolAI <i className="fas fa-sparkles"></i></h1>
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

// I'll continue in the next message due to length...
