import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, Compass, Bell, MessageCircle, User, LogOut } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { logout, user } = useContext(AuthContext);

  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={24} /> },
    { name: 'Explore', path: '/explore', icon: <Compass size={24} /> },
    { name: 'Notifications', path: '/notifications', icon: <Bell size={24} /> },
    { name: 'Messages', path: '/messages', icon: <MessageCircle size={24} /> },
    { name: 'Profile', path: `/profile/${user?._id}`, icon: <User size={24} /> },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-logo">
        <h2>VibeFeed</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
              >
                {item.icon}
                <span className="nav-label">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={logout}>
          <LogOut size={24} />
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
