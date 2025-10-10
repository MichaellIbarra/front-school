import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children, sidebarId = "menu-item", sidebarId1 = "menu-items" }) => {
  return (
    <>
      <Header />
      <Sidebar id={sidebarId} id1={sidebarId1} />
      {children}
    </>
  );
};

export default Layout;