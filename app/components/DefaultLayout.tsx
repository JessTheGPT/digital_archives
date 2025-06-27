"use client";

import { Notifications } from "./Notifications";
import { Logo } from "./Logo";
import { createRoom } from "../utils/liveblocks";
import { redirect } from "next/navigation";
import { CreateIcon } from "../icons/CreateIcon";
import { ReactNode, useState, useEffect } from "react";
import { getPageUrl } from "../config";
import { PageLinks } from "./PageLinks";
import { CreateWithAiLink } from "./CreateWithAiLink";

export default function DefaultLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  async function create() {
    const room = await createRoom();
    window.location.href = getPageUrl(room.id);
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-full max-h-full relative">
      {/* Mobile backdrop */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border md:hidden"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {isSidebarOpen ? (
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            ) : (
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16" 
              />
            )}
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile 
          ? `fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'relative'
        }
        w-[240px] bg-gray-50 border-r border-gray-100 flex-shrink-0 flex flex-col
      `}>
        <div className="flex items-center justify-between p-3">
          <div className="w-28 text-black">
            <Logo />
          </div>
          <button onClick={create} className="flex items-center">
            <span className="sr-only">Create new page</span>
            <CreateIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2 flex flex-col gap-0.5">
          <Notifications />
          <CreateWithAiLink />
        </div>

        <div className="text-xs font-medium text-gray-500 mt-6 pl-2">Pages</div>

        <div onClick={closeSidebar}>
          <PageLinks />
        </div>
      </div>

      {/* Main content */}
      <div className={`
        relative flex flex-col h-full w-full
        ${isMobile ? 'ml-0' : ''}
      `}>
        {children}
      </div>
    </div>
  );
}
