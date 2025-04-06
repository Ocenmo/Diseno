import React from 'react';

const FlyoutButton = ({ onClick, children }) => {
    return (
    <div className='flex h-screen justify-center bg-neutral-900 px-3 py-12'>
        <FlyoutLink onClick={onClick}>{children}</FlyoutLink>
    </div>
    );
}
const FlyoutLink = ({ children, onClick }) => {
    return (
        <div className="group relative h-fit w-fit">
            <button className="relative text-white" onClick={onClick}>
                {children}
                
            </button>
        </div>
    );
}

export default FlyoutButton;