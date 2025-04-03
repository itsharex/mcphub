const { useState, useEffect, Fragment } = React;
const { ChevronDown, ChevronRight } = window.LucideIcons || {};

function Badge({ status }) {
  const colors = {
    connecting: 'bg-yellow-100 text-yellow-800',
    connected: 'bg-green-100 text-green-800',
    disconnected: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status]}`}
    >
      {status}
    </span>
  );
}

function ToolCard({ tool }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-4">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-medium text-gray-900">{tool.name}</h3>
        <button className="text-gray-400 hover:text-gray-600">
          {isExpanded ? (
            ChevronDown ? (
              <ChevronDown size={18} />
            ) : (
              '▼'
            )
          ) : ChevronRight ? (
            <ChevronRight size={18} />
          ) : (
            '▶'
          )}
        </button>
      </div>
      {isExpanded && (
        <div className="mt-4">
          <p className="text-gray-600 mb-2">{tool.description || 'No description available'}</p>
          <div className="bg-gray-50 rounded p-2">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Input Schema:</h4>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(tool.inputSchema, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function ServerCard({ server, onRemove }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleRemove = (e) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onRemove(server.name);
    setShowDeleteDialog(false);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold text-gray-900">{server.name}</h2>
          <Badge status={server.status} />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRemove}
            className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm"
          >
            Delete
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            {isExpanded ? (
              ChevronDown ? (
                <ChevronDown size={18} />
              ) : (
                '▼'
              )
            ) : ChevronRight ? (
              <ChevronRight size={18} />
            ) : (
              '▶'
            )}
          </button>
        </div>
      </div>

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        serverName={server.name}
      />

      {isExpanded && server.tools && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Available Tools</h3>
          <div className="space-y-4">
            {server.tools.map((tool, index) => (
              <ToolCard key={index} tool={tool} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddServerForm({ onAdd }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [serverType, setServerType] = useState('stdio');
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    command: '',
    arguments: '',
    args: [],
  });
  const [envVars, setEnvVars] = useState([]);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleArgsChange = (value) => {
    let args = value.split(' ').filter((arg) => arg.trim() !== '');
    setFormData({ ...formData, arguments: value, args });
  };

  const handleEnvVarChange = (index, field, value) => {
    const newEnvVars = [...envVars];
    newEnvVars[index][field] = value;
    setEnvVars(newEnvVars);
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const removeEnvVar = (index) => {
    const newEnvVars = [...envVars];
    newEnvVars.splice(index, 1);
    setEnvVars(newEnvVars);
  };

  const toggleModal = () => {
    setModalVisible(!modalVisible);
    setError(null);
    if (!modalVisible) {
      setEnvVars([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Convert env vars array to object format
      const env = {};
      envVars.forEach(({ key, value }) => {
        if (key.trim()) {
          env[key.trim()] = value;
        }
      });

      const payload = {
        name: formData.name,
        config:
          serverType === 'sse'
            ? { url: formData.url }
            : { 
                command: formData.command, 
                args: formData.args,
                env: Object.keys(env).length > 0 ? env : undefined
              },
      };

      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Failed to add server');
        return;
      }

      setFormData({
        name: '',
        url: '',
        command: '',
        arguments: '',
        args: [],
      });
      setEnvVars([]);
      setModalVisible(false);

      onAdd();
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  return (
    <div>
      <button
        onClick={toggleModal}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
      >
        Add New Server
      </button>

      {modalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white shadow rounded-lg p-6 w-full max-w-xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add New Server</h2>
              <button onClick={toggleModal} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Server Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="e.g., time-mcp"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Server Type</label>
                <div className="flex space-x-4">
                  <div>
                    <input
                      type="radio"
                      id="command"
                      name="serverType"
                      value="command"
                      checked={serverType === 'stdio'}
                      onChange={() => setServerType('stdio')}
                      className="mr-1"
                    />
                    <label htmlFor="command">stdio</label>
                  </div>
                  <div>
                    <input
                      type="radio"
                      id="url"
                      name="serverType"
                      value="url"
                      checked={serverType === 'sse'}
                      onChange={() => setServerType('sse')}
                      className="mr-1"
                    />
                    <label htmlFor="url">sse</label>
                  </div>
                </div>
              </div>

              {serverType === 'sse' ? (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="url">
                    Server URL
                  </label>
                  <input
                    type="url"
                    name="url"
                    id="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="e.g., http://localhost:3000/sse"
                    required={serverType === 'sse'}
                  />
                </div>
              ) : (
                <Fragment>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="command">
                      Command
                    </label>
                    <input
                      type="text"
                      name="command"
                      id="command"
                      value={formData.command}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="e.g., npx"
                      required={serverType === 'stdio'}
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="arguments"
                    >
                      Arguments
                    </label>
                    <input
                      type="text"
                      name="arguments"
                      id="arguments"
                      value={formData.arguments}
                      onChange={(e) => handleArgsChange(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="e.g., -y time-mcp"
                      required={serverType === 'stdio'}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-gray-700 text-sm font-bold">
                        Environment Variables
                      </label>
                      <button
                        type="button"
                        onClick={addEnvVar}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1 px-2 rounded text-sm flex items-center"
                      >
                        + Add
                      </button>
                    </div>
                    {envVars.map((envVar, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <div className="flex items-center space-x-2 flex-grow">
                          <input
                            type="text"
                            value={envVar.key}
                            onChange={(e) => handleEnvVarChange(index, 'key', e.target.value)}
                            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-1/2"
                            placeholder="key"
                          />
                          <span className="flex items-center">:</span>
                          <input
                            type="text"
                            value={envVar.value}
                            onChange={(e) => handleEnvVarChange(index, 'value', e.target.value)}
                            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-1/2"
                            placeholder="value"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEnvVar(index)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1 px-2 rounded text-sm flex items-center justify-center min-w-[56px] ml-2"
                        >
                          - Del
                        </button>
                      </div>
                    ))}
                  </div>
                </Fragment>
              )}

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={toggleModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
                >
                  Add Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [servers, setServers] = useState([]);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch('/api/servers')
      .then((response) => response.json())
      .then((data) => {
        // 处理API响应中的包装对象，提取data字段
        if (data && data.success && Array.isArray(data.data)) {
          setServers(data.data);
        } else if (data && Array.isArray(data)) {
          // 兼容性处理，如果API直接返回数组
          setServers(data);
        } else {
          // 如果数据格式不符合预期，设置为空数组
          console.error('Invalid server data format:', data);
          setServers([]);
        }
      })
      .catch((err) => setError(err.message));

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetch('/api/servers')
        .then((response) => response.json())
        .then((data) => {
          // 处理API响应中的包装对象，提取data字段
          if (data && data.success && Array.isArray(data.data)) {
            setServers(data.data);
          } else if (data && Array.isArray(data)) {
            // 兼容性处理，如果API直接返回数组
            setServers(data);
          } else {
            // 如果数据格式不符合预期，设置为空数组
            console.error('Invalid server data format:', data);
            setServers([]);
          }
        })
        .catch((err) => setError(err.message));
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshKey]);

  const handleServerAdd = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleServerRemove = async (serverName) => {
    try {
      const response = await fetch(`/api/servers/${serverName}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || `Failed to delete server ${serverName}`);
        return;
      }

      setRefreshKey((prevKey) => prevKey + 1);
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-red-600 text-xl font-semibold">Error</h2>
            <p className="text-gray-600 mt-2">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-4 bg-red-100 text-red-800 py-1 px-3 rounded hover:bg-red-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">MCP Hub Dashboard</h1>
          <AddServerForm onAdd={handleServerAdd} />
        </div>

        {servers.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600">No MCP servers available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {servers.map((server, index) => (
              <ServerCard key={index} server={server} onRemove={handleServerRemove} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
