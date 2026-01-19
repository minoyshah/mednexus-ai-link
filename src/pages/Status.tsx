import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, RefreshCw } from "lucide-react";

const Status = () => {
  const services = [
    { name: "Web Application", status: "operational", uptime: "99.99%" },
    { name: "API Services", status: "operational", uptime: "99.98%" },
    { name: "Authentication", status: "operational", uptime: "100%" },
    { name: "Database", status: "operational", uptime: "99.99%" },
    { name: "File Storage", status: "operational", uptime: "99.97%" },
    { name: "Video Meetings", status: "operational", uptime: "99.95%" },
    { name: "AI Services", status: "operational", uptime: "99.90%" },
    { name: "Email Delivery", status: "operational", uptime: "99.99%" },
  ];

  const incidents = [
    { date: "January 10, 2026", title: "Scheduled Maintenance Completed", status: "resolved", description: "Database optimization completed successfully with no service interruption." },
    { date: "December 28, 2025", title: "Video Meeting Latency", status: "resolved", description: "Brief latency issues with video meetings in EU region. Resolved within 15 minutes." },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "outage":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Status Banner */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">All Systems Operational</h1>
              <p className="text-sm text-muted-foreground">Last updated: Just now</p>
            </div>
          </div>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Services */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Service Status</h2>
          <div className="space-y-3">
            {services.map((service) => (
              <div 
                key={service.name} 
                className="p-4 bg-card rounded-lg border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <span className="font-medium text-foreground">{service.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{service.uptime} uptime</span>
                  <span className="text-sm text-green-500 capitalize">{service.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Uptime */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">90-Day Uptime</h2>
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: 90 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 h-8 rounded-sm ${i === 45 ? 'bg-amber-500' : 'bg-green-500'}`}
                  title={i === 45 ? "Partial outage" : "Operational"}
                />
              ))}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>90 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Incidents */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Recent Incidents</h2>
          <div className="space-y-4">
            {incidents.map((incident) => (
              <div key={incident.title} className="p-6 bg-card rounded-xl border border-border">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="text-sm text-muted-foreground">{incident.date}</span>
                    <h3 className="font-semibold text-foreground">{incident.title}</h3>
                  </div>
                  <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full capitalize">
                    {incident.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{incident.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Subscribe */}
        <div className="mt-16 text-center p-8 bg-muted/50 rounded-xl">
          <h2 className="text-xl font-bold text-foreground mb-3">Subscribe to Updates</h2>
          <p className="text-muted-foreground mb-6">Get notified when service status changes.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground"
            />
            <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
              Subscribe
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Status;
