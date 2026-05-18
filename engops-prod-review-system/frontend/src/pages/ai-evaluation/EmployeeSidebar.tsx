import type { ScopedEmployee } from '../../data/evaluationData';
type Props = {
  employees: ScopedEmployee[];
  selectedKey: string;
  onSelect: (key: string) => void;
  poolKeys: Set<string>;
  onTogglePool: (key: string) => void;
  onSelectAllPool: () => void;
  onClearPool: () => void;
  listMode: 'view' | 'pool';
  emptyMessage?: string;
};

export function EmployeeSidebar({
  employees,
  selectedKey,
  onSelect,
  poolKeys,
  onTogglePool,
  onSelectAllPool,
  onClearPool,
  listMode,
  emptyMessage,
}: Props) {
  return (
    <aside className="ai-eval-sidebar">
      <div className="ai-eval-sidebar-head">
        <h2>{listMode === 'pool' ? 'Allocation pool' : 'Reviewees in scope'}</h2>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
          {listMode === 'pool' ? `${poolKeys.size} selected for fit check` : `${employees.length} from submissions`}
        </div>
        {listMode === 'pool' && employees.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <button type="button" className="secondary-btn" style={{ padding: '4px 10px', fontSize: 11 }} onClick={onSelectAllPool}>
              Select all
            </button>
            <button type="button" className="secondary-btn" style={{ padding: '4px 10px', fontSize: 11 }} onClick={onClearPool}>
              Clear
            </button>
          </div>
        )}
      </div>
      {employees.length === 0 ? (
        <div style={{ padding: 16, fontSize: 12, color: 'var(--text3)' }}>
          {emptyMessage ?? 'Select review forms in Setup to load reviewees.'}
        </div>
      ) : (
        employees.map((e) => {
          const inPool = poolKeys.has(e.employeeKey);
          const active = selectedKey === e.employeeKey;
          const st = e.storedEval?.status;
          return (
            <div key={e.employeeKey} className={`ai-eval-emp-row ${active ? 'active' : ''}`}>
              {listMode === 'pool' && (
                <input
                  type="checkbox"
                  checked={inPool}
                  onChange={() => onTogglePool(e.employeeKey)}
                  onClick={(ev) => ev.stopPropagation()}
                />
              )}
              <button type="button" className="ai-eval-emp-btn-inner" onClick={() => onSelect(e.employeeKey)}>
                <div className="ai-eval-emp-name">{e.employeeName}</div>
                <div className="ai-eval-emp-meta">
                  {e.submissionCount} sub(s) · avg {e.avgSubmissionScore}
                  {st && st !== 'not_generated' ? ` · ${st}` : ''}
                </div>
              </button>
            </div>
          );
        })
      )}
    </aside>
  );
}
