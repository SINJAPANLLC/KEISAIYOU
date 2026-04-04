import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { lazy, Suspense, useEffect } from "react";

const LandingPage = lazy(() => import("@/pages/home"));

const pageImports = {
  login:                  () => import("@/pages/login"),
  register:               () => import("@/pages/register"),
  forgotPassword:         () => import("@/pages/forgot-password"),
  resetPassword:          () => import("@/pages/reset-password"),
  dashboard:              () => import("@/pages/dashboard"),
  jobs:                   () => import("@/pages/jobs"),
  applications:           () => import("@/pages/applications"),
  apply:                  () => import("@/pages/apply"),
  payment:                () => import("@/pages/payment"),
  userSettings:           () => import("@/pages/user-settings"),
  adminDashboard:         () => import("@/pages/admin-dashboard"),
  adminRevenue:           () => import("@/pages/admin-revenue"),
  adminIndeedFeed:        () => import("@/pages/admin-indeed-feed"),
  adminUsers:             () => import("@/pages/admin-users"),
  adminListings:          () => import("@/pages/admin-listings"),
  adminApplications:      () => import("@/pages/admin-applications"),
  adminEmailMarketing:    () => import("@/pages/admin-email-marketing"),
  adminNotifications:     () => import("@/pages/admin-notifications"),
  adminContactInquiries:  () => import("@/pages/admin-contact-inquiries"),
  adminRefundRequests:    () => import("@/pages/admin-refund-requests"),
  adminAuditLogs:         () => import("@/pages/admin-audit-logs"),
  adminSettings:          () => import("@/pages/admin-settings"),
  guide:                  () => import("@/pages/guide"),
  faq:                    () => import("@/pages/faq"),
  contact:                () => import("@/pages/contact"),
  companyInfo:            () => import("@/pages/company-info"),
  terms:                  () => import("@/pages/terms"),
  privacy:                () => import("@/pages/privacy"),
  notFound:               () => import("@/pages/not-found"),
};

const Login               = lazy(pageImports.login);
const Register            = lazy(pageImports.register);
const ForgotPassword      = lazy(pageImports.forgotPassword);
const ResetPassword       = lazy(pageImports.resetPassword);
const Dashboard           = lazy(pageImports.dashboard);
const Jobs                = lazy(pageImports.jobs);
const Applications        = lazy(pageImports.applications);
const Apply               = lazy(pageImports.apply);
const Payment             = lazy(pageImports.payment);
const UserSettings        = lazy(pageImports.userSettings);
const AdminDashboard      = lazy(pageImports.adminDashboard);
const AdminRevenue        = lazy(pageImports.adminRevenue);
const AdminIndeedFeed     = lazy(pageImports.adminIndeedFeed);
const AdminUsers          = lazy(pageImports.adminUsers);
const AdminListings       = lazy(pageImports.adminListings);
const AdminApplications   = lazy(pageImports.adminApplications);
const AdminEmailMarketing = lazy(pageImports.adminEmailMarketing);
const AdminNotifications  = lazy(pageImports.adminNotifications);
const AdminContactInquiries = lazy(pageImports.adminContactInquiries);
const AdminRefundRequests = lazy(pageImports.adminRefundRequests);
const AdminAuditLogs      = lazy(pageImports.adminAuditLogs);
const AdminSettings       = lazy(pageImports.adminSettings);
const Guide               = lazy(pageImports.guide);
const Faq                 = lazy(pageImports.faq);
const Contact             = lazy(pageImports.contact);
const CompanyInfoPage     = lazy(pageImports.companyInfo);
const Terms               = lazy(pageImports.terms);
const Privacy             = lazy(pageImports.privacy);
const NotFound            = lazy(pageImports.notFound);

function usePreloadAllPages() {
  useEffect(() => {
    const timer = setTimeout(() => {
      Object.values(pageImports).forEach((fn) => fn().catch(() => {}));
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
}

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <img src="/logo-keisaiyou.png" alt="KEI SAIYOU" className="h-9 w-auto" />
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingFallback />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <LoadingFallback />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (!isAdmin) return <Redirect to="/home" />;
  return <Component />;
}

const DASHBOARD_PATHS = [
  "/home", "/jobs", "/applications", "/payment", "/settings",
  "/admin", "/admin/revenue", "/admin/indeed-feed", "/admin/users",
  "/admin/listings", "/admin/applications", "/admin/email-marketing",
  "/admin/notifications", "/admin/contact-inquiries", "/admin/refund-requests",
  "/admin/audit-logs", "/admin/settings",
];

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        {/* Public */}
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/guide" component={Guide} />
        <Route path="/faq" component={Faq} />
        <Route path="/contact" component={Contact} />
        <Route path="/company-info" component={CompanyInfoPage} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />

        {/* User (protected) */}
        <Route path="/home">{() => <ProtectedRoute component={Dashboard} />}</Route>
        <Route path="/jobs/new">{() => <ProtectedRoute component={Jobs} />}</Route>
        <Route path="/jobs">{() => <ProtectedRoute component={Jobs} />}</Route>
        <Route path="/applications">{() => <ProtectedRoute component={Applications} />}</Route>
        <Route path="/apply/:id" component={Apply} />
        <Route path="/payment">{() => <ProtectedRoute component={Payment} />}</Route>
        <Route path="/settings">{() => <ProtectedRoute component={UserSettings} />}</Route>

        {/* Admin */}
        <Route path="/admin">{() => <AdminRoute component={AdminDashboard} />}</Route>
        <Route path="/admin/revenue">{() => <AdminRoute component={AdminRevenue} />}</Route>
        <Route path="/admin/indeed-feed">{() => <AdminRoute component={AdminIndeedFeed} />}</Route>
        <Route path="/admin/users">{() => <AdminRoute component={AdminUsers} />}</Route>
        <Route path="/admin/listings">{() => <AdminRoute component={AdminListings} />}</Route>
        <Route path="/admin/applications">{() => <AdminRoute component={AdminApplications} />}</Route>
        <Route path="/admin/email-marketing">{() => <AdminRoute component={AdminEmailMarketing} />}</Route>
        <Route path="/admin/notifications">{() => <AdminRoute component={AdminNotifications} />}</Route>
        <Route path="/admin/contact-inquiries">{() => <AdminRoute component={AdminContactInquiries} />}</Route>
        <Route path="/admin/refund-requests">{() => <AdminRoute component={AdminRefundRequests} />}</Route>
        <Route path="/admin/audit-logs">{() => <AdminRoute component={AdminAuditLogs} />}</Route>
        <Route path="/admin/settings">{() => <AdminRoute component={AdminSettings} />}</Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppLayout() {
  const [loc] = useLocation();
  const { isAuthenticated } = useAuth();
  const isDashboardPage = isAuthenticated && DASHBOARD_PATHS.some((p) => loc === p || loc.startsWith(p + "/"));
  const isApplyPage = loc.startsWith("/apply/");

  usePreloadAllPages();

  useEffect(() => {
    if (typeof (window as any).__dismissSplash === "function") {
      (window as any).__dismissSplash();
    }
  }, []);

  if (isApplyPage) {
    return <Router />;
  }

  if (isDashboardPage) {
    return (
      <div className="fixed inset-0 flex flex-col">
        <Header />
        <div className="flex-1 min-h-0 overflow-hidden">
          <Router />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1"><Router /></main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppLayout />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
