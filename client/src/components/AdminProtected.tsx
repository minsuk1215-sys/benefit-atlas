import { Navigate } from 'react-router-dom';
import { isAdminLoggedIn } from '../utils/adminAuth';

interface Props {
  children: React.ReactNode;
}

export default function AdminProtected({ children }: Props) {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}