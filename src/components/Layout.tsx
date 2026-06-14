import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
    header: React.ReactNode;
    bottomNav: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, header, bottomNav }) => {
    return (
        <div className="layout-container">
            <header className="layout-header">
                {header}
            </header>

            <main className="layout-main-content no-scrollbar">
                {children}
            </main>

            <nav className="layout-bottom-nav">
                {bottomNav}
            </nav>
        </div>
    );
};

export default React.memo(Layout);
