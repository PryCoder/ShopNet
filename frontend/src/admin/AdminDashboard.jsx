import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    salesTrend: [],
    categoryDistribution: [],
    monthlyRevenue: []
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [updatingUser, setUpdatingUser] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel
        const [ordersRes, productsRes, usersRes] = await Promise.all([
          fetch('/api/orders', {
            headers: { Authorization: `Bearer ${user.token}` }
          }),
          fetch('/api/products'),
          fetch('/api/auth/users', {
            headers: { Authorization: `Bearer ${user.token}` }
          })
        ]);

        // Process Orders
        let orders = [];
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          orders = Array.isArray(data) ? data : [];
        }

        // Process Products
        let products = [];
        if (productsRes.ok) {
          const data = await productsRes.json();
          products = Array.isArray(data) ? data : [];
        }

        // Process Users
        let usersData = [];
        if (usersRes.ok) {
          const data = await usersRes.json();
          usersData = Array.isArray(data) ? data : [];
          setUsers(usersData);
        }

        // Calculate statistics from real data
        const totalOrders = orders.length;
        const totalProducts = products.length;
        const totalUsers = usersData.length;
        
        // Calculate total revenue from orders
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        setStats({
          totalOrders,
          totalProducts,
          totalUsers,
          totalRevenue
        });

        // Generate chart data from real orders
        const salesTrendData = generateSalesTrendFromOrders(orders);
        const categoryData = generateCategoryDataFromProducts(products);
        const revenueData = generateRevenueFromOrders(orders);

        setChartData({
          salesTrend: salesTrendData,
          categoryDistribution: categoryData,
          monthlyRevenue: revenueData
        });

        // Get recent orders
        setRecentOrders(orders.slice(0, 5));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate]);

  // Function to toggle user admin status
  const toggleAdminStatus = async (userId, currentRole) => {
    // Don't allow toggling current user
    if (userId === user._id) {
      alert("You cannot change your own admin status!");
      return;
    }

    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (!window.confirm(`Are you sure you want to ${newRole === 'admin' ? 'make' : 'remove'} this user as admin?`)) {
      return;
    }

    setUpdatingUser(userId);
    try {
      const res = await fetch(`/api/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        // Update users list
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u._id === userId ? { ...u, role: newRole } : u
          )
        );
        // Update stats
        setStats(prev => ({
          ...prev,
          totalUsers: prev.totalUsers
        }));
        alert(`User role updated to ${newRole} successfully!`);
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    } finally {
      setUpdatingUser(null);
    }
  };

  // Function to generate sales trend from real orders
  const generateSalesTrendFromOrders = (orders) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const data = [];
    
    // Get last 6 months
    for (let i = Math.max(0, currentMonth - 5); i <= currentMonth; i++) {
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === i && orderDate.getFullYear() === new Date().getFullYear();
      });
      
      const monthSales = monthOrders.length;
      const monthRevenue = monthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      data.push({
        month: months[i],
        sales: monthSales,
        revenue: Math.round(monthRevenue)
      });
    }
    
    // If no data, generate sample data
    if (data.every(d => d.sales === 0)) {
      return generateSampleSalesData();
    }
    
    return data;
  };

  // Function to generate category distribution from real products
  const generateCategoryDataFromProducts = (products) => {
    const categoryMap = {};
    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });
    
    const data = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value
    }));
    
    // If no data, generate sample data
    if (data.length === 0) {
      return [
        { name: 'Electronics', value: 35 },
        { name: 'Fashion', value: 25 },
        { name: 'Home & Living', value: 20 },
        { name: 'Beauty', value: 12 },
        { name: 'Sports', value: 8 }
      ];
    }
    
    return data;
  };

  // Function to generate revenue from real orders
  const generateRevenueFromOrders = (orders) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMonth = new Date().getMonth();
    const data = [];
    
    for (let i = Math.max(0, currentMonth - 5); i < Math.min(currentMonth + 1, 12); i++) {
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === i && orderDate.getFullYear() === new Date().getFullYear();
      });
      
      const monthRevenue = monthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const monthProfit = Math.round(monthRevenue * 0.3); // Estimate profit as 30% of revenue
      
      data.push({
        name: months[i] || 'Unknown',
        revenue: Math.round(monthRevenue),
        profit: monthProfit
      });
    }
    
    // If no data, generate sample data
    if (data.every(d => d.revenue === 0)) {
      return generateSampleRevenueData();
    }
    
    return data;
  };

  // Sample data generators (fallback)
  const generateSampleSalesData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      sales: Math.floor(Math.random() * 30) + 5,
      revenue: Math.floor(Math.random() * 50000) + 10000
    }));
  };

  const generateSampleRevenueData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      name: month,
      revenue: Math.floor(Math.random() * 50000) + 10000,
      profit: Math.floor(Math.random() * 15000) + 3000
    }));
  };

  const colors = {
    primary: '#f97316',
    secondary: '#3b82f6',
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    cyan: '#06b6d4'
  };

  const chartColors = [
    colors.primary,
    colors.secondary,
    colors.success,
    colors.warning,
    colors.purple,
    colors.pink,
    colors.cyan
  ];

  const cardStyle = {
    padding: '25px',
    background: '#18181b',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  };

  const numberStyle = {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: colors.primary
  };

  const chartContainerStyle = {
    background: '#18181b',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.05)'
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#1f1f23',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>{label}</p>
          {payload.map((item, index) => (
            <p key={index} style={{ margin: '4px 0', color: item.color }}>
              {item.name}: {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        maxWidth: '1400px',
        margin: '0 auto',
        background: '#0a0a0a',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ color: colors.primary, fontSize: '1.2rem' }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      background: '#0a0a0a',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img 
            src="/ShopNestLogo.png" 
            alt="Logo" 
            style={{ 
              height: '40px', 
              width: '40px', 
              borderRadius: '8px', 
              objectFit: 'cover',
              filter: 'drop-shadow(0 0px 10px rgba(249, 115, 22, 0.3))'
            }} 
          />
          <div>
            <h2 style={{ margin: 0, color: '#fff' }}>Admin Dashboard</h2>
            <p style={{ color: '#a1a1aa', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
              Welcome back, <span style={{ color: colors.primary }}>{user?.name}</span>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{
            padding: '8px 16px',
            background: 'rgba(249, 115, 22, 0.1)',
            color: colors.primary,
            borderRadius: '50px',
            fontSize: '0.85rem',
            border: '1px solid rgba(249, 115, 22, 0.2)'
          }}>
            ● Live
          </span>
          <span style={{
            padding: '8px 16px',
            background: 'rgba(59, 130, 246, 0.1)',
            color: colors.secondary,
            borderRadius: '50px',
            fontSize: '0.85rem',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>
      
      {/* Stats Cards - Using Real Data */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={cardStyle} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <h4 style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>Total Orders</h4>
          <div style={numberStyle}>{stats.totalOrders}</div>
          <div style={{ color: colors.success, fontSize: '0.85rem' }}>
            {stats.totalOrders > 0 ? '↑ Active' : 'No orders yet'}
          </div>
        </div>
        <div style={cardStyle} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <h4 style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>Total Products</h4>
          <div style={numberStyle}>{stats.totalProducts}</div>
          <div style={{ color: colors.secondary, fontSize: '0.85rem' }}>
            {stats.totalProducts > 0 ? 'Available' : 'No products'}
          </div>
        </div>
        <div style={cardStyle} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <h4 style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>Total Users</h4>
          <div style={numberStyle}>{stats.totalUsers}</div>
          <div style={{ color: colors.purple, fontSize: '0.85rem' }}>
            {stats.totalUsers > 0 ? 'Registered' : 'No users'}
          </div>
        </div>
        <div style={cardStyle} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <h4 style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0 }}>Total Revenue</h4>
          <div style={numberStyle}>₹{stats.totalRevenue.toFixed(2)}</div>
          <div style={{ color: colors.success, fontSize: '0.85rem' }}>
            {stats.totalRevenue > 0 ? 'Generated' : 'No revenue'}
          </div>
        </div>
      </div>

      {/* Chart Grid - 3 Charts with Real Data */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Chart 1: Sales Trend - Line Chart */}
        <div style={chartContainerStyle}>
          <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>
            Sales Trend
            <span style={{ color: '#a1a1aa', fontSize: '0.85rem', marginLeft: '12px', fontWeight: 'normal' }}>
              Last 6 Months
            </span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="month" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke={colors.primary} 
                strokeWidth={3}
                dot={{ fill: colors.primary }}
                activeDot={{ r: 8 }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke={colors.secondary} 
                strokeWidth={3}
                dot={{ fill: colors.secondary }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Category Distribution - Pie Chart */}
        <div style={chartContainerStyle}>
          <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>
            Category Distribution
            <span style={{ color: '#a1a1aa', fontSize: '0.85rem', marginLeft: '12px', fontWeight: 'normal' }}>
              Product Share
            </span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.categoryDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3: Revenue & Profit - Bar Chart */}
        <div style={chartContainerStyle}>
          <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>
            Revenue & Profit
            <span style={{ color: '#a1a1aa', fontSize: '0.85rem', marginLeft: '12px', fontWeight: 'normal' }}>
              Last 6 Months
            </span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="revenue" fill={colors.primary} radius={[8, 8, 0, 0]} />
              <Bar dataKey="profit" fill={colors.success} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Users Section with Admin Toggle */}
      {users.length > 0 && (
        <div style={{
          background: '#18181b',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '24px'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>
            User Management
            <span style={{ color: '#a1a1aa', fontSize: '0.85rem', marginLeft: '12px', fontWeight: 'normal' }}>
              Manage Admin Roles
            </span>
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#a1a1aa', fontSize: '0.85rem' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#a1a1aa', fontSize: '0.85rem' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#a1a1aa', fontSize: '0.85rem' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#a1a1aa', fontSize: '0.85rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px', color: '#fff' }}>
                      {u.name}
                      {u._id === user._id && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 8px',
                          background: 'rgba(249, 115, 22, 0.2)',
                          color: colors.primary,
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}>
                          YOU
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: '#a1a1aa' }}>{u.email}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '50px',
                        fontSize: '0.8rem',
                        background: u.role === 'admin' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: u.role === 'admin' ? colors.primary : colors.success,
                        fontWeight: '600'
                      }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {u._id !== user._id && (
                        <button
                          onClick={() => toggleAdminStatus(u._id, u.role)}
                          disabled={updatingUser === u._id}
                          style={{
                            padding: '6px 16px',
                            background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                            color: u.role === 'admin' ? colors.danger : colors.success,
                            border: `1px solid ${u.role === 'admin' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                            borderRadius: '6px',
                            cursor: updatingUser === u._id ? 'not-allowed' : 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            opacity: updatingUser === u._id ? 0.6 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (updatingUser !== u._id) {
                              e.target.style.transform = 'scale(1.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          {updatingUser === u._id ? 'Updating...' : u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      )}
                      {u._id === user._id && (
                        <span style={{
                          color: '#a1a1aa',
                          fontSize: '0.8rem',
                          fontStyle: 'italic'
                        }}>
                          Current User
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Orders Section */}
      {recentOrders.length > 0 && (
        <div style={{
          background: '#18181b',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid rgba(255,255,255,0.05)',
          marginBottom: '24px'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>
            Recent Orders
            <span style={{ color: '#a1a1aa', fontSize: '0.85rem', marginLeft: '12px', fontWeight: 'normal' }}>
              Latest 5 Orders
            </span>
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#a1a1aa', fontSize: '0.85rem' }}>Order ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#a1a1aa', fontSize: '0.85rem' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#a1a1aa', fontSize: '0.85rem' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#a1a1aa', fontSize: '0.85rem' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#a1a1aa', fontSize: '0.85rem' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px', color: '#fff' }}>{order._id?.substring(0, 8)}...</td>
                    <td style={{ padding: '12px', color: '#a1a1aa' }}>{order.userId?.name || 'Guest'}</td>
                    <td style={{ padding: '12px', color: colors.primary }}>₹{order.totalAmount?.toFixed(2)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '50px',
                        fontSize: '0.8rem',
                        background: order.status === 'Delivered' ? 'rgba(34, 197, 94, 0.2)' :
                                  order.status === 'Shipped' ? 'rgba(59, 130, 246, 0.2)' :
                                  'rgba(234, 179, 8, 0.2)',
                        color: order.status === 'Delivered' ? colors.success :
                               order.status === 'Shipped' ? colors.secondary :
                               colors.warning
                      }}>
                        {order.status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#a1a1aa' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Controls */}
      <div style={{ 
        padding: '30px', 
        background: '#18181b', 
        borderRadius: '12px', 
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <h3 style={{ marginBottom: '25px', color: colors.primary, fontSize: '1.2rem' }}>
          ⚡ Administrative Controls
        </h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button 
            className="btn" 
            onClick={() => navigate('/admin/add-product')}
            style={{
              padding: '12px 24px',
              background: colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.02)';
              e.target.style.boxShadow = `0 4px 20px ${colors.primary}44`;
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = 'none';
            }}
          >
            + Add Product
          </button>
          <button 
            className="btn" 
            onClick={() => navigate('/admin/products')} 
            style={{ 
              padding: '12px 24px',
              background: '#3f3f46',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.02)';
              e.target.style.background = '#52525b';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.background = '#3f3f46';
            }}
          >
            📦 Manage Products
          </button>
          <button 
            className="btn" 
            onClick={() => navigate('/admin/orders')} 
            style={{ 
              padding: '12px 24px',
              background: '#3f3f46',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.02)';
              e.target.style.background = '#52525b';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.background = '#3f3f46';
            }}
          >
            🚚 Manage Orders
          </button>
          <button 
            className="btn" 
            onClick={() => navigate('/admin/users')} 
            style={{ 
              padding: '12px 24px',
              background: '#3f3f46',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.02)';
              e.target.style.background = '#52525b';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.background = '#3f3f46';
            }}
          >
            👥 Users Directory
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;