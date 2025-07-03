import React, { useState } from "react";
import axios from "axios";
import { Input } from "./components/input.jsx";
import { Button } from "./components/button.jsx";
import { Card } from "./components/card.jsx";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend
} from "recharts";
import "./index.css";

function App() {
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    start_date: "",
    end_date: ""
  });

  const [data, setData] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/api/analyze", form);
      setData(res.data.data);
      setInsights(res.data.insights);
    } catch (err) {
      console.error("Error:", err);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>Airline Demand & Price Trend Analyzer</h1>

      <div className="form-grid">
        <Input name="origin" placeholder="Origin (e.g. SYD)" onChange={handleChange} />
        <Input name="destination" placeholder="Destination (e.g. MEL)" onChange={handleChange} />
        <Input name="start_date" type="date" onChange={handleChange} />
        <Input name="end_date" type="date" onChange={handleChange} />
      </div>

      <Button onClick={fetchData} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Trends"}
      </Button>

      {data.length > 0 && (
        <Card title="Bookings & Prices Over Time">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" label={{ value: 'Bookings', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Price ($)', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#8884d8" />
              <Line yAxisId="right" type="monotone" dataKey="price" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {insights && !insights.error && (
        <Card title="AI Insights">
          <p><strong>Demand Trend:</strong> {insights.demand_trend}</p>
          <p><strong>Price Trend:</strong> {insights.price_trend}</p>
          <p><strong>Popular Days:</strong> {insights.popular_days?.join(', ')}</p>
          <p><strong>Observations:</strong> {insights.observations}</p>
        </Card>
      )}

      {insights?.error && (
        <Card title="Error">
          <p className="error">{insights.error}</p>
        </Card>
      )}
    </div>
  );
}

export default App;
