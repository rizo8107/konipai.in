import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  expiryTime: Date;
  onExpire?: () => void;
  className?: string;
}

export function CountdownTimer({ expiryTime, onExpire, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = expiryTime.getTime() - now.getTime();
      
      if (difference <= 0) {
        setIsExpired(true);
        if (onExpire) {
          onExpire();
        }
        return {
          hours: 0,
          minutes: 0,
          seconds: 0,
        };
      }
      
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      return {
        hours,
        minutes,
        seconds,
      };
    };
    
    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [expiryTime, onExpire]);
  
  const formatTime = (value: number) => {
    return value < 10 ? `0${value}` : value.toString();
  };
  
  if (isExpired) {
    return null;
  }
  
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center space-x-1">
        <div className="flex flex-col items-center">
          <div className="bg-primary text-white text-sm font-bold px-2 py-1 rounded">
            {formatTime(timeLeft.hours)}
          </div>
          <span className="text-xs mt-1">Hours</span>
        </div>
        <span className="text-lg font-bold">:</span>
        <div className="flex flex-col items-center">
          <div className="bg-primary text-white text-sm font-bold px-2 py-1 rounded">
            {formatTime(timeLeft.minutes)}
          </div>
          <span className="text-xs mt-1">Min</span>
        </div>
        <span className="text-lg font-bold">:</span>
        <div className="flex flex-col items-center">
          <div className="bg-primary text-white text-sm font-bold px-2 py-1 rounded">
            {formatTime(timeLeft.seconds)}
          </div>
          <span className="text-xs mt-1">Sec</span>
        </div>
      </div>
    </div>
  );
}
