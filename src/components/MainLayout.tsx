import React from 'react';

interface MainLayoutProps {
    children: React.ReactNode;
    header: React.ReactNode;
    bottomNav: React.ReactNode;
    isBgAnimated?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, header, bottomNav, isBgAnimated = true }) => {
    return (
        <div className={`layout-container ${!isBgAnimated ? 'static-bg' : ''}`}>
            {header && (
                <header className="layout-header">
                    {header}
                </header>
            )}

            <main className="layout-main-content no-scrollbar">
                {children}
            </main>

            {bottomNav && (
                <div className="modern-bottom-nav-wrapper">
                    {bottomNav}
                </div>
            )}
        </div>
    );
};

export default MainLayout;
