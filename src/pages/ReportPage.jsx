// src/pages/ReportPage.jsx
import { useState } from 'react';
import { getDefectReport, getDefectsByDeveloper } from '../services/api';
import Header from '../components/layout/Header';
import BugDetailModal from '../components/defects/BugDetailModal';
import styles from './ReportPage.module.css';

const priorityColors = { P1: '#ef4444', P2: '#f59e0b', P3: '#22c55e' };
const severityColors = {
  Blocking: '#dc2626', Critical: '#ef4444', Major: '#ea580c',
  Minor: '#d97706', Low: '#16a34a',
};
const statusColors = {
  Open: '#3b82f6', 'In Progress': '#a855f7', Resolved: '#22c55e', Closed: '#6b7280',
};

export default function ReportPage() {
  // Project Report tab
  const [projectId, setProjectId] = useState('');
  const [projectReport, setProjectReport] = useState(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectError, setProjectError] = useState('');

  // Developer Search tab
  const [developerId, setDeveloperId] = useState('');
  const [devBugs, setDevBugs] = useState(null);
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState('');

  const [activeTab, setActiveTab] = useState('project');
  const [selectedBug, setSelectedBug] = useState(null);

  const fetchProjectReport = async () => {
    if (!projectId) return setProjectError('Please enter a project ID.');
    setProjectError('');
    setProjectReport(null);
    setProjectLoading(true);
    try {
      const res = await getDefectReport(parseInt(projectId));
      setProjectReport(res.data);
    } catch (e) {
      setProjectError(e.response?.data || 'No records found for this project ID.');
    } finally {
      setProjectLoading(false);
    }
  };

  const fetchDevBugs = async () => {
    if (!developerId.trim()) return setDevError('Please enter a developer ID.');
    setDevError('');
    setDevBugs(null);
    setDevLoading(true);
    try {
      const res = await getDefectsByDeveloper(developerId.trim());
      setDevBugs(res.data);
    } catch (e) {
      setDevError('Failed to fetch bugs for this developer.');
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Header title="Project Report" subtitle="Analyse defects by project or developer" />

      <div className={styles.content}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'project' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('project')}
          >
            📊 Project Report
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'developer' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('developer')}
          >
            👨‍💻 Developer Bugs
          </button>
        </div>

        {/* Project Report Tab */}
        {activeTab === 'project' && (
          <div className={styles.tabContent}>
            <div className={styles.searchBar}>
              <input
                className={styles.input}
                type="number"
                placeholder="Enter Project Code (e.g. 1001)"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchProjectReport()}
              />
              <button
                className={styles.searchBtn}
                onClick={fetchProjectReport}
                disabled={projectLoading}
              >
                {projectLoading ? '...' : 'Generate Report'}
              </button>
            </div>

            {projectError && <div className={styles.errorMsg}>⚠️ {projectError}</div>}

            {projectReport && (
              <div className={styles.report}>
                <div className={styles.reportHeader}>
                  <h3 className={styles.reportTitle}>Project #{projectReport.projectId}</h3>
                  <span className={styles.reportCount}>{projectReport.defects.length} bugs</span>
                </div>

                {/* Summary stats */}
                <div className={styles.summaryGrid}>
                  {Object.entries(
                    projectReport.defects.reduce((acc, d) => {
                      acc[d.status] = (acc[d.status] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([status, count]) => (
                    <div key={status} className={styles.summaryCard}>
                      <div className={styles.summaryCount} style={{ color: statusColors[status] || '#888' }}>{count}</div>
                      <div className={styles.summaryLabel}>{status}</div>
                    </div>
                  ))}
                </div>

                {/* Table */}
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Priority</th>
                        <th>Severity</th>
                        <th>Status</th>
                        <th>Detected</th>
                        <th>Expected Fix</th>
                        <th>Developer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectReport.defects.map((bug) => (
                        <tr
                          key={bug.id}
                          className={styles.tableRow}
                          onClick={() => setSelectedBug(bug)}
                        >
                          <td><span className={styles.idCell}>#{bug.id}</span></td>
                          <td className={styles.titleCell}>{bug.title}</td>
                          <td>
                            <span className={styles.pill} style={{ background: `${priorityColors[bug.priority]}20`, color: priorityColors[bug.priority] }}>
                              {bug.priority}
                            </span>
                          </td>
                          <td>
                            <span className={styles.pill} style={{ background: `${severityColors[bug.severity] || '#888'}20`, color: severityColors[bug.severity] || '#888' }}>
                              {bug.severity}
                            </span>
                          </td>
                          <td>
                            <span className={styles.pill} style={{ background: `${statusColors[bug.status] || '#888'}20`, color: statusColors[bug.status] || '#888' }}>
                              {bug.status}
                            </span>
                          </td>
                          <td className={styles.dateCell}>{bug.detectedon}</td>
                          <td className={styles.dateCell}>{bug.expectedresolution}</td>
                          <td className={styles.devCell}>{bug.assignedtodeveloperid}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Developer Tab */}
        {activeTab === 'developer' && (
          <div className={styles.tabContent}>
            <div className={styles.searchBar}>
              <input
                className={styles.input}
                placeholder="Enter Developer ID (e.g. dev01)"
                value={developerId}
                onChange={(e) => setDeveloperId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchDevBugs()}
              />
              <button
                className={styles.searchBtn}
                onClick={fetchDevBugs}
                disabled={devLoading}
              >
                {devLoading ? '...' : 'Search Bugs'}
              </button>
            </div>

            {devError && <div className={styles.errorMsg}>⚠️ {devError}</div>}

            {devBugs !== null && (
              <div className={styles.report}>
                <div className={styles.reportHeader}>
                  <h3 className={styles.reportTitle}>Bugs for: {developerId}</h3>
                  <span className={styles.reportCount}>{devBugs.length} bugs assigned</span>
                </div>
                {devBugs.length === 0 ? (
                  <p className={styles.emptyMsg}>No bugs assigned to this developer.</p>
                ) : (
                  <div className={styles.devBugGrid}>
                    {devBugs.map((bug) => (
                      <div
                        key={bug.id}
                        className={styles.devBugCard}
                        onClick={() => setSelectedBug(bug)}
                      >
                        <div className={styles.devCardTop}>
                          <span className={styles.idCell}>#{bug.id}</span>
                          <span className={styles.pill} style={{ background: `${priorityColors[bug.priority]}20`, color: priorityColors[bug.priority] }}>
                            {bug.priority}
                          </span>
                          <span className={styles.pill} style={{ background: `${statusColors[bug.status] || '#888'}20`, color: statusColors[bug.status] || '#888' }}>
                            {bug.status}
                          </span>
                        </div>
                        <div className={styles.devCardTitle}>{bug.title}</div>
                        <div className={styles.devCardMeta}>{bug.severity} · {bug.detectedon}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedBug && (
        <BugDetailModal
          bug={selectedBug}
          onClose={() => setSelectedBug(null)}
          onUpdated={() => {
            setSelectedBug(null);
            if (activeTab === 'project') fetchProjectReport();
            else fetchDevBugs();
          }}
        />
      )}
    </div>
  );
}
