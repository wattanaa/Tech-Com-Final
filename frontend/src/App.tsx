import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AdminRoot } from '@/layouts/AdminRoot';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Spinner } from '@/components/ui/feedback';

/**
 * เส้นทางของเว็บไซต์สาธารณะ (PHASE 9)
 * แต่ละหน้าถูกแยก bundle ด้วย React.lazy เพื่อให้หน้าแรกโหลดเฉพาะที่จำเป็น
 */
const LoginPage = lazy(() => import('@/pages/admin/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() =>
  import('@/pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const AdminTeachersPage = lazy(() =>
  import('@/pages/admin/content/TeachersPage').then((m) => ({ default: m.TeachersPage })),
);
const AdminStudentsPage = lazy(() =>
  import('@/pages/admin/content/StudentsPage').then((m) => ({ default: m.StudentsPage })),
);
const AdminProgramsPage = lazy(() =>
  import('@/pages/admin/content/ProgramsPage').then((m) => ({ default: m.ProgramsPage })),
);
const AdminCoursesPage = lazy(() =>
  import('@/pages/admin/content/CoursesPage').then((m) => ({ default: m.CoursesPage })),
);
const AdminFacilitiesPage = lazy(() =>
  import('@/pages/admin/content/FacilitiesPage').then((m) => ({ default: m.FacilitiesPage })),
);
const AdminAlbumsPage = lazy(() =>
  import('@/pages/admin/content/AlbumsPage').then((m) => ({ default: m.AlbumsPage })),
);
const AdminCategoriesPage = lazy(() =>
  import('@/pages/admin/content/CategoriesPage').then((m) => ({ default: m.CategoriesPage })),
);
const AdminNewsListPage = lazy(() =>
  import('@/pages/admin/content/NewsListPage').then((m) => ({ default: m.NewsListPage })),
);
const AdminNewsEditorPage = lazy(() =>
  import('@/pages/admin/content/NewsEditorPage').then((m) => ({ default: m.NewsEditorPage })),
);
const AdminActivitiesListPage = lazy(() =>
  import('@/pages/admin/content/ActivitiesListPage').then((m) => ({ default: m.ActivitiesListPage })),
);
const AdminActivitiesEditorPage = lazy(() =>
  import('@/pages/admin/content/ActivitiesEditorPage').then((m) => ({ default: m.ActivitiesEditorPage })),
);
const AdminProjectsListPage = lazy(() =>
  import('@/pages/admin/content/ProjectsListPage').then((m) => ({ default: m.ProjectsListPage })),
);
const AdminProjectsEditorPage = lazy(() =>
  import('@/pages/admin/content/ProjectsEditorPage').then((m) => ({ default: m.ProjectsEditorPage })),
);
const AdminMediaLibraryPage = lazy(() =>
  import('@/pages/admin/MediaLibraryPage').then((m) => ({ default: m.MediaLibraryPage })),
);
const AdminHomepageBuilderPage = lazy(() =>
  import('@/pages/admin/homepage/HomepageBuilderPage').then((m) => ({ default: m.HomepageBuilderPage })),
);
const AdminNavigationPage = lazy(() =>
  import('@/pages/admin/navigation/NavigationPage').then((m) => ({ default: m.NavigationPage })),
);
const AdminSettingsPage = lazy(() =>
  import('@/pages/admin/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const AdminAlbumImagesPage = lazy(() =>
  import('@/pages/admin/gallery/AlbumImagesPage').then((m) => ({ default: m.AlbumImagesPage })),
);
const AdminUsersPage = lazy(() => import('@/pages/admin/users/UsersPage').then((m) => ({ default: m.UsersPage })));
const AdminAuditLogPage = lazy(() => import('@/pages/admin/AuditLogPage').then((m) => ({ default: m.AuditLogPage })));
const AdminBackupPage = lazy(() => import('@/pages/admin/BackupPage').then((m) => ({ default: m.BackupPage })));
const AdminMessagesPage = lazy(() => import('@/pages/admin/MessagesPage').then((m) => ({ default: m.MessagesPage })));

const HomePage = lazy(() => import('@/pages/public/HomePage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const ProgramsPage = lazy(() => import('@/pages/public/ProgramsPage'));
const ProgramDetailPage = lazy(() => import('@/pages/public/ProgramDetailPage'));
const CoursesPage = lazy(() => import('@/pages/public/CoursesPage'));
const TeachersPage = lazy(() => import('@/pages/public/TeachersPage'));
const ProjectsPage = lazy(() => import('@/pages/public/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/public/ProjectDetailPage'));
const ActivitiesPage = lazy(() => import('@/pages/public/ActivitiesPage'));
const NewsPage = lazy(() => import('@/pages/public/NewsPage'));
const NewsDetailPage = lazy(() => import('@/pages/public/NewsDetailPage'));
const FacilitiesPage = lazy(() => import('@/pages/public/FacilitiesPage'));
const GalleryPage = lazy(() => import('@/pages/public/GalleryPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));
const SearchPage = lazy(() => import('@/pages/public/SearchPage'));
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'));

export default function App() {
  return (
    <Suspense fallback={<div className="pt-24"><Spinner /></div>}>
      <Routes>
        <Route path="/admin" element={<AdminRoot />}>
          <Route path="login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="teachers" element={<AdminTeachersPage />} />
              <Route path="students" element={<AdminStudentsPage />} />
              <Route path="programs" element={<AdminProgramsPage />} />
              <Route path="courses" element={<AdminCoursesPage />} />
              <Route path="facilities" element={<AdminFacilitiesPage />} />
              <Route path="albums" element={<AdminAlbumsPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="news" element={<AdminNewsListPage />} />
              <Route path="news/:id" element={<AdminNewsEditorPage />} />
              <Route path="activities" element={<AdminActivitiesListPage />} />
              <Route path="activities/:id" element={<AdminActivitiesEditorPage />} />
              <Route path="projects" element={<AdminProjectsListPage />} />
              <Route path="projects/:id" element={<AdminProjectsEditorPage />} />
              <Route path="media" element={<AdminMediaLibraryPage />} />
              <Route path="homepage" element={<AdminHomepageBuilderPage />} />
              <Route path="navigation" element={<AdminNavigationPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="gallery/:albumId" element={<AdminAlbumImagesPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="audit-logs" element={<AdminAuditLogPage />} />
              <Route path="backups" element={<AdminBackupPage />} />
              <Route path="messages" element={<AdminMessagesPage />} />
            </Route>
          </Route>
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/programs/:code" element={<ProgramDetailPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:slug" element={<NewsDetailPage />} />
          <Route path="/facilities" element={<FacilitiesPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
