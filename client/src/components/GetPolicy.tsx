import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { useTable } from 'react-table';

interface Policy {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  rules: {
    dataRetention: {
      isEnabled: boolean;
      value: string;
    };
    cookiePolicy: {
      isEnabled: boolean;
      value: string;
    };
  };
}

const GetPolicy: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const dataRetentionChartRef = useRef<Chart | null>(null);
  const cookiePolicyChartRef = useRef<Chart | null>(null);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch('http://localhost:8080/v2/policy');
      const data = await response.json();
      setPolicies(data.policies);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (policies.length > 0) {
      calculatePolicyStatusDistribution();
    }
  }, [policies]);

  const calculatePolicyStatusDistribution = () => {
    const policyStatusCounts = policies.reduce((acc: { [key: string]: number }, policy) => {
      acc[policy.status] = (acc[policy.status] || 0) + 1;
      return acc;
    }, {});

    const data = {
      labels: Object.keys(policyStatusCounts),
      datasets: [
        {
          label: 'Number of Policies',
          data: Object.values(policyStatusCounts),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(document.getElementById('policyChart'), {
      type: 'bar',
      data: data,
    });
  };

  const fetchSelectedPolicyData = async (policyId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/v2/policy/${policyId}`);
      const data = await response.json();
      setSelectedPolicy(data.policy);
    } catch (error) {
      console.error('Error fetching policy data:', error);
    }
  };

  useEffect(() => {
    const policyId = 'bb69a22d-0d7c-46a2-b2f0-78a420878516';
    fetchSelectedPolicyData(policyId);
  }, []);

  const renderDataRetentionChart = () => {
    if (selectedPolicy) {
      const dataRetentionData = {
        labels: ['Data Retention Duration'],
        datasets: [
          {
            label: 'Data Retention Duration (months)',
            data: [parseInt(selectedPolicy.rules.dataRetention.value) || 0],
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      };

      if (dataRetentionChartRef.current) {
        dataRetentionChartRef.current.destroy();
      }

      dataRetentionChartRef.current = new Chart(document.getElementById('dataRetentionChart'), {
        type: 'bar',
        data: dataRetentionData,
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });

      const downloadDataRetentionButton = document.getElementById('downloadDataRetentionButton');
      if (downloadDataRetentionButton) {
        downloadDataRetentionButton.href = dataRetentionChartRef.current.toBase64Image();
        downloadDataRetentionButton.download = 'data_retention_chart.png';
      }
    }
  };

  const renderCookiePolicyChart = () => {
    if (selectedPolicy) {
      const cookiePolicyData = {
        labels: ['Cookie Policy', 'Other'],
        datasets: [
          {
            data: [selectedPolicy.rules.cookiePolicy.isEnabled ? 1 : 0, 1],
            backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(255, 159, 64, 0.6)'],
            borderColor: ['rgba(255, 99, 132, 1)', 'rgba(255, 159, 64, 1)'],
            borderWidth: 1,
          },
        ],
      };

      if (cookiePolicyChartRef.current) {
        cookiePolicyChartRef.current.destroy();
      }

      cookiePolicyChartRef.current = new Chart(document.getElementById('cookiePolicyChart'), {
        type: 'pie',
        data: cookiePolicyData,
      });

      const downloadCookiePolicyButton = document.getElementById('downloadCookiePolicyButton');
      if (downloadCookiePolicyButton) {
        downloadCookiePolicyButton.href = cookiePolicyChartRef.current.toBase64Image();
        downloadCookiePolicyButton.download = 'cookie_policy_chart.png';
      }
    }
  };

  useEffect(() => {
    renderDataRetentionChart();
    renderCookiePolicyChart();
  }, [selectedPolicy]);

  return (
    <div>
      <div>
        <h2>Policy List</h2>
        <ul>
          {policies.map(policy => (
            <li key={policy.id}>
              {policy.id} - {policy.status} - {policy.startDate} - {policy.endDate}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2>Policy Status Distribution</h2>
        <canvas id="policyChart" width="400" height="200"></canvas>
      </div>

      {selectedPolicy ? (
        <div>
          <h2>Selected Policy Details</h2>
          <p>ID: {selectedPolicy.id}</p>
          <p>Status: {selectedPolicy.status}</p>
          <p>Domain: {selectedPolicy.domain}</p>
          <p>Owner: {selectedPolicy.owner.name}</p>
          <p>Email: {selectedPolicy.owner.email}</p>
          <p>Phone: {selectedPolicy.owner.phone}</p>
          <p>Title: {selectedPolicy.descriptor.title}</p>
          <p>Summary: {selectedPolicy.descriptor.summary}</p>
          <p>Content: {selectedPolicy.descriptor.content}</p>
          <p>Type: {selectedPolicy.type}</p>

          <div>
            <h2>Data Retention Duration</h2>
            <canvas id="dataRetentionChart" width="400" height="200"></canvas>
            <a
              id="downloadDataRetentionButton"
              className="block mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              style={{ display: selectedPolicy ? 'block' : 'none' }}
              download="data_retention_chart.png"
            >
              Download Data Retention Chart
            </a>
          </div>

          <div>
            <h2>Cookie Policy</h2>
            <canvas id="cookiePolicyChart" width="400" height="200"></canvas>
            <a
              id="downloadCookiePolicyButton"
              className="block mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              style={{ display: selectedPolicy ? 'block' : 'none' }}
              download="cookie_policy_chart.png"
            >
              Download Cookie Policy Chart
            </a>
          </div>
        </div>
      ) : (
        <p>Loading policy data...</p>
      )}
    </div>
  );
};

export default GetPolicy;
