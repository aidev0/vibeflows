// Utility functions for managing user sessions

export interface DeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
  screen?: string;
  timezone?: string;
  language?: string;
}

export const getDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined') return {};

  const userAgent = navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  // Detect OS
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  // Detect device type
  let device = 'Desktop';
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    device = 'Mobile';
  } else if (/iPad/i.test(userAgent)) {
    device = 'Tablet';
  }

  return {
    browser,
    os,
    device,
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language
  };
};

export const createUserSession = async (options?: {
  flow_id?: string;
  chat_id?: string;
  user_profile?: any;
}): Promise<string | null> => {
  try {
    const deviceInfo = getDeviceInfo();
    
    const response = await fetch('/api/user-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'timezone': deviceInfo.timezone || 'UTC'
      },
      body: JSON.stringify({ 
        device_info: deviceInfo,
        flow_id: options?.flow_id,
        chat_id: options?.chat_id,
        user_profile: options?.user_profile
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Session created:', data);
      return data.session_id;
    } else {
      console.error('Failed to create session:', response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
};

export const updateUserSession = async (session_id: string, updates: {
  flow_id?: string;
  chat_id?: string;
  status?: string;
}): Promise<boolean> => {
  try {
    const response = await fetch('/api/user-sessions', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ session_id, ...updates })
    });

    if (response.ok) {
      console.log('Session updated:', updates);
      return true;
    } else {
      console.error('Failed to update session:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error updating session:', error);
    return false;
  }
};

export const getLatestFlowFromMessages = (messages: any[]): string | null => {
  // Look for flow_id in messages (reverse order to get latest)
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    
    // Check if message text contains Flow ID pattern
    const flowIdMatch = message.text?.match(/Flow ID:\s*([a-zA-Z0-9]+)/i);
    if (flowIdMatch) {
      return flowIdMatch[1];
    }
    
    // Check if message has flow_id property
    if (message.flow_id) {
      return message.flow_id;
    }
    
    // Check for ObjectId patterns in message text
    const objectIdMatch = message.text?.match(/[a-f\d]{24}/i);
    if (objectIdMatch) {
      return objectIdMatch[0];
    }
  }
  
  return null;
};

export const getUserSessions = async () => {
  try {
    const response = await fetch('/api/user-sessions');
    if (response.ok) {
      return await response.json();
    }
    return { sessions: [] };
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return { sessions: [] };
  }
};