import { useState, useEffect } from "react";
import { login, logout, hasRole, authedFetch, API_BASE } from "./auth";

export default function App() {
  const [api, setApi] = useState("checking...");
  const [id, setId] = useState(null);
  const [nationalId, setNationalId] = useState("AB123456");
  const [type, setType] = useState("deferment");
  const [branch, setBranch] = useState("army");
  const isCitizen = hasRole("citizen");

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then(r => r.json())
      .then(d => setApi(d.status))
      .catch(() => setApi("offline"));
  }, []);

  async function submitApp(e) {
    e.preventDefault();
    if (!isCitizen) { login(); return; }

    const payload = {
      citizen_national_id: nationalId,
      type,
      desired_branch: branch,
    };

    const data = await authedFetch(`${API_BASE}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setId(data.id);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-600">Citizen Portal</h1>
        <div className="flex gap-2">
          <button onClick={login}  className="px-3 py-2 bg-blue-600 text-white rounded">Login</button>
          <button onClick={logout} className="px-3 py-2 bg-gray-600 text-white rounded">Logout</button>
        </div>
      </div>

      {!isCitizen && (
        <p className="p-3 rounded bg-yellow-50 border border-yellow-200">
          You must sign in as <b>citizen</b> to submit an application.
        </p>
      )}

      <p>API status: <b>{api}</b></p>

      {isCitizen && (
        <form onSubmit={submitApp} className="space-y-2 max-w-md">
          <input
            className="w-full border p-2 rounded"
            value={nationalId}
            onChange={e=>setNationalId(e.target.value)}
            placeholder="National ID"
          />
          <select className="w-full border p-2 rounded" value={type} onChange={e=>setType(e.target.value)}>
            <option value="deferment">Deferment</option>
            <option value="enlistment">Enlistment</option>
          </select>
          <select className="w-full border p-2 rounded" value={branch} onChange={e=>setBranch(e.target.value)}>
            <option value="army">Army</option>
            <option value="navy">Navy</option>
            <option value="air">Air</option>
          </select>
          <button className="px-3 py-2 bg-blue-600 text-white rounded">Submit application</button>
        </form>
      )}

      {id && <p>Created application ID: <b>{id}</b></p>}
    </div>
  );
}
