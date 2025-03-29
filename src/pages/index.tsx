import React, { useState } from 'react';
import DashboardPage from '@/components/product_and_roles';
// Define an interface for our sidebar options
interface SidebarOption {
  id: string;
  label: string;
  component: React.FC;
}

// Example components (you'll replace these with your actual components)
const OrderComponent: React.FC = () => (
  <div className="p-4 bg-white">
    <h2 className="text-2xl font-bold">Orders Management</h2>
    {/* Add your order management content */}
  </div>
);

const InventoryComponent: React.FC = () => (
  <div className="p-4 bg-white">
    <h2 className="text-2xl font-bold">Inventory Management</h2>
    {/* Add your inventory management content */}
  </div>
);

const AnalyticsComponent: React.FC = () => (
  <div className="p-4 bg-white">
    <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
    {/* Add your analytics content */}
  </div>
);

export default function Home() {
  const sidebarOptions: SidebarOption[] = [
    { 
      id: 'orders', 
      label: 'Dashboard', 
      component: OrderComponent 
    },
    { 
      id: 'inventory', 
      label: 'Master Order', 
      component: InventoryComponent 
    },
    { 
      id: 'analytics', 
      label: 'Manufactring', 
      component: AnalyticsComponent 
    },
    {
      id: 'analytics', 
      label: 'Sales Order', 
      component: AnalyticsComponent
    },
    {
      id: 'analytics', 
      label: 'All Order', 
      component: AnalyticsComponent
    },
    {
      id: 'analytics', 
      label: 'Products and Roles', 
      component: DashboardPage
    }
    
  ];
 
  // State to manage the currently selected component
  const [selectedComponent, setSelectedComponent] = useState<React.FC>(() => OrderComponent);

  return (
    <>
      <div className="h-20 flex justify-center items-center bg-white-400 border-b-4 border-black">
        <div className="flex items-center w-full text-3xl m-7">
          <b>Order System</b>
        </div>
      </div>
      <div className="flex justify-center items-center h-screen bg-main">
        <div className="bg-white border-r-4 border-black h-screen w-[15%]">
          <div className="space-y">
            {sidebarOptions.map((option) => (
              <div key={option.id} className="flex items-center">

              <button
                key={option.id}
                className={`w-full p-4   border-b-4 border-black ${
                  option.component === selectedComponent 
                  ? 'bg-main' 
                  : 'hover:bg-[#f8bdbd] '
                }`}
                onClick={() => setSelectedComponent(() => option.component)}
                >
                <span className=' text-2xl font-semibold'>
                  {option.label}
                  </span>
              </button>
                </div>
            ))}
          </div>
        </div>
        <div className="bg-[#fcd7d7] h-screen w-[85%] overflow-auto">
          {React.createElement(selectedComponent)}
        </div>
      </div>
    </>
  );
}