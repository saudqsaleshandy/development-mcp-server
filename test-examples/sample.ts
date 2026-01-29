import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import * as lodash from 'lodash';

interface User {
  id: number;
  name: string;
  email: string;
}

export class UserService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async fetchUser(userId: number): Promise<User> {
    const response = await axios.get(`${this.apiUrl}/users/${userId}`);
    return response.data;
  }

  static formatUserName(user: User): string {
    return lodash.upperFirst(user.name);
  }
}

export function calculateTotal(items: number[]): number {
  return items.reduce((sum, item) => sum + item, 0);
}

export const formatDate = (dateString: string): string => {
  const date = parseISO(dateString);
  return format(date, 'yyyy-MM-dd');
};

export const useUserData = (userId: number) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const service = new UserService('https://api.example.com');
        const userData = await service.fetchUser(userId);
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { user, loading };
};

interface DataProcessor {
  processData(data: string[]): string[];
}

export type StringTransformer = {
  transform(input: string): string;
  reverse(input: string): string;
};
