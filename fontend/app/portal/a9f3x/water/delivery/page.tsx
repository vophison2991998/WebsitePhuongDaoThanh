"use client";

import React from 'react';
import WaterDeliveryPageUI from './WaterDeliveryPageUI'; 
import { useWaterDeliveryLogic, initialDeliveries } from './WaterDeliveryLogic'; 

const WaterDeliveryPage: React.FC = () => {
    // Luôn truyền initialDeliveries (đã được export mảng rỗng trong logic)
    const logicProps = useWaterDeliveryLogic(initialDeliveries);

    return <WaterDeliveryPageUI {...logicProps} />;
};

export default WaterDeliveryPage;