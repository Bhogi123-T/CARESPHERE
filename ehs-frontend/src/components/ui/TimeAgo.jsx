import React, { useState, useEffect } from 'react';

const TimeAgo = ({ timestamp }) => {
  const [timeText, setTimeText] = useState('Just now');

  useEffect(() => {
    if (!timestamp) return;
    
    const updateTime = () => {
      const date = new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z');
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) {
        setTimeText('Just now');
      } else if (diffMins === 1) {
        setTimeText('1 min ago');
      } else if (diffMins < 60) {
        setTimeText(`${diffMins} mins ago`);
      } else {
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours === 1) {
          setTimeText('1 hr ago');
        } else if (diffHours < 24) {
          setTimeText(`${diffHours} hrs ago`);
        } else {
          const diffDays = Math.floor(diffHours / 24);
          setTimeText(`${diffDays} day${diffDays > 1 ? 's' : ''} ago`);
        }
      }
    };

    updateTime();
    const intervalId = setInterval(updateTime, 60000);
    return () => clearInterval(intervalId);
  }, [timestamp]);

  return <>{timeText}</>;
};

export default TimeAgo;
