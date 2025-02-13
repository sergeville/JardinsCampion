'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import styles from './styles.module.css';
import LogoModal from './LogoModal';
import DataEditModal from './DataEditModal';
import { useDbSync } from '@/hooks/useDbSync';
import { DatabaseInfo, DatabaseCollections, DatabaseDocument } from '@/types/database';

interface Logo {
  src: string;
  alt: string;
  value: string;
}

interface CollectionData {
  [key: string]: DatabaseDocument<unknown>[];
}

export default function ShowData() {
  const { dbState, error: syncError, status, isSyncing, sync } = useDbSync();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'schemas' | 'collections' | 'counts'>('schemas');
  const [filterText, setFilterText] = useState('');
  const [selectedLogo, setSelectedLogo] = useState<Logo | null>(null);
  const [editModalState, setEditModalState] = useState({
    isOpen: false,
    mode: 'add' as const,
    collectionName: '',
    initialData: null as DatabaseDocument<unknown> | null,
  });

  // Transform dbState to match the expected DatabaseInfo format
  const data: DatabaseInfo | null = useMemo(() => {
    if (!dbState) return null;

    return {
      schemas: dbState.schemas || {
        User: {},
        Vote: {},
        Logo: {},
      },
      collections: {
        users: dbState.users || [],
        votes: dbState.votes || [],
        logos: dbState.logos || [],
      },
      counts: {
        users: (dbState.users || []).length,
        votes: (dbState.votes || []).length,
        logos: (dbState.logos || []).length,
      },
    };
  }, [dbState]);

  useEffect(() => {
    if (data || syncError) {
      setLoading(false);
    }
    if (syncError) {
      setError(syncError);
    }
  }, [data, syncError]);

  const handleExport = (type: 'json' | 'csv') => {
    if (!data) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      ...data,
    };

    if (type === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-info-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === 'csv') {
      let csv = '';
      // Handle collections
      Object.entries(data.collections).forEach(([collectionName, items]) => {
        if (items.length === 0) return;

        // Headers
        const headers = Object.keys(items[0]);
        csv += `\n${collectionName}\n${headers.join(',')}\n`;

        // Data
        items.forEach((item) => {
          const row = headers.map((header) => {
            const value = item[header];
            return typeof value === 'object' ? JSON.stringify(value) : value;
          });
          csv += row.join(',') + '\n';
        });
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-info-${new Date().toISOString()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const filterData = (items: any[]) => {
    if (!filterText) return items;

    return items.filter((item) =>
      Object.values(item).some((value) =>
        JSON.stringify(value).toLowerCase().includes(filterText.toLowerCase())
      )
    );
  };

  const handleLogoRowClick = (logo: Logo) => {
    setSelectedLogo(logo);
  };

  const handleAdd = (collectionName: keyof DatabaseCollections) => {
    const emptyData = collectionName === 'logos'
      ? { src: '', alt: '', value: '' }
      : Object.fromEntries(
          Object.keys(data!.collections[collectionName][0]).map((key) => [key, ''])
        );

    setEditModalState({
      isOpen: true,
      mode: 'add',
      collectionName,
      initialData: emptyData as DatabaseDocument<unknown>,
    });
  };

  const handleEdit = (
    collectionName: keyof DatabaseCollections,
    item: DatabaseDocument<unknown>
  ) => {
    setEditModalState({
      isOpen: true,
      mode: 'edit',
      collectionName,
      initialData: item,
    });
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    const { collectionName, mode } = editModalState;
    const endpoint = `/api/database-info/${mode === 'add' ? 'create' : 'update'}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collection: collectionName,
        data: formData,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save data');
    }

    const result = await response.json();
    setData((prev) => {
      if (!prev) return null;
      const collections = { ...prev.collections };
      if (mode === 'add') {
        collections[collectionName] = [
          ...collections[collectionName],
          result.data,
        ];
      } else {
        collections[collectionName] = collections[collectionName].map((item) =>
          item._id === result.data._id ? result.data : item
        );
      }
      return { ...prev, collections };
    });
  };

  const handleDelete = async () => {
    const { collectionName, data: itemData } = editModalState;

    const response = await fetch(`/api/database-info/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collectionName,
        id: itemData._id,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error);
    }

    // Refresh the data
    await fetchData();
  };

  const renderControls = () => (
    <div className={styles.controls}>
      <div className={styles.syncStatus}>
        <span className={`${styles.statusIndicator} ${styles[status]}`} />
        Database Status: {status}
        <button
          onClick={sync}
          disabled={isSyncing || status === 'connecting'}
          className={styles.syncButton}
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
      <div className={styles.filterControls}>
        <input
          type="text"
          placeholder="Filter data..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className={styles.filterInput}
        />
      </div>
      <div className={styles.exportControls}>
        <button onClick={() => handleExport('json')} className={styles.exportButton}>
          Export JSON
        </button>
        <button onClick={() => handleExport('csv')} className={styles.exportButton}>
          Export CSV
        </button>
      </div>
    </div>
  );

  const renderCollections = () => (
    <div className={styles.collections}>
      <h2>Collection Data</h2>
      {Object.entries(data.collections).map(([name, items]) => (
        <div key={name} className={styles.collectionCard}>
          <div className={styles.collectionHeader}>
            <h3>{name.charAt(0).toUpperCase() + name.slice(1)}</h3>
            <button className={styles.addButton} onClick={() => handleAdd(name as keyof DatabaseCollections)}>
              Add New
            </button>
          </div>
          <div className={styles.tableWrapper}>
            {items.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    {Object.keys(items[0]).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                    <th className={styles.actionColumn}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filterData(items).map((item, index) => (
                    <tr
                      key={index}
                      onClick={() => (name === 'logos' ? handleLogoRowClick(item as unknown as Logo) : undefined)}
                      style={{ cursor: name === 'logos' ? 'pointer' : 'default' }}
                    >
                      {Object.values(item).map((value: any, i) => (
                        <td key={i}>{JSON.stringify(value)}</td>
                      ))}
                      <td className={styles.actionColumn}>
                        <button
                          className={styles.editButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(name as keyof DatabaseCollections, item as DatabaseDocument<unknown>);
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No data in collection</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  if (loading && !data) {
    return <div className={styles.loading}>Loading database information...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!data) {
    return <div className={styles.error}>No data available</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Database Information</h1>

      {renderControls()}

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'schemas' ? styles.active : ''}`}
          onClick={() => setActiveTab('schemas')}
        >
          Schemas
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'collections' ? styles.active : ''}`}
          onClick={() => setActiveTab('collections')}
        >
          Collections
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'counts' ? styles.active : ''}`}
          onClick={() => setActiveTab('counts')}
        >
          Counts
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'schemas' && (
          <div className={styles.schemas}>
            <h2>Schema Definitions</h2>
            {Object.entries(data.schemas).map(([name, schema]) => (
              <div key={name} className={styles.schemaCard}>
                <h3>{name} Schema</h3>
                <pre>{JSON.stringify(schema, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'collections' && renderCollections()}

        {activeTab === 'counts' && (
          <div className={styles.counts}>
            <h2>Collection Counts</h2>
            <div className={styles.countsGrid}>
              {Object.entries(data.counts).map(([name, count]) => (
                <div key={name} className={styles.countCard}>
                  <h3>{name.charAt(0).toUpperCase() + name.slice(1)}</h3>
                  <p>{count}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <LogoModal
        isOpen={selectedLogo !== null}
        onClose={() => setSelectedLogo(null)}
        logo={selectedLogo}
      />

      <DataEditModal
        isOpen={editModalState.isOpen}
        onClose={() => setEditModalState((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleSave}
        onDelete={editModalState.mode === 'edit' ? handleDelete : undefined}
        data={editModalState.initialData}
        collectionName={editModalState.collectionName}
        mode={editModalState.mode}
      />
    </div>
  );
}
