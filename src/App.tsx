import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProjectProvider } from './auth/ProjectContext'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './features/auth/page/LoginPage'
import { MyWorkPage } from './features/mywork/page/MyWorkPage'
import { DashboardPage } from './features/dashboard/page/DashboardPage'
import { SchedulePage } from './features/schedule/page/SchedulePage'
import { BugsPage } from './features/bugs/page/BugsPage'
import { StructurePage } from './features/structure/page/StructurePage'
import { MembersPage } from './features/members/page/MembersPage'
import { MeetingsPage } from './features/meetings/page/MeetingsPage'
import { ProjectsPage } from './features/projects/page/ProjectsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <ProjectProvider>
                  <Layout />
                </ProjectProvider>
              </RequireAuth>
            }
          >
            <Route index element={<MyWorkPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="bugs" element={<BugsPage />} />
            <Route path="structure" element={<StructurePage />} />
            <Route path="meetings" element={<MeetingsPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
