'use client';

import { useEffect, useState, useMemo } from 'react';
import styles from './styles.module.css';
import LogoModal from './LogoModal';
import DataEditModal from './DataEditModal';
import { useDbSync } from '@/hooks/useDbSync';
import {
  DatabaseInfo,
  DatabaseCollections,
  DatabaseDocument,
  DatabaseSyncState,
} from '@/types/database';
import ErrorMessage from '@/components/ErrorMessage';
import { Document } from 'mongoose';
import { ILogo } from '@/models/Logo';
import { IUser } from '@/models/User';
import { IVote } from '@/models/Vote';
import { LogoUploadModal } from './LogoUploadModal';
import Image from 'next/image';

type DataTab = keyof DatabaseCollections | 'all';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface DataSummary {
  total: number;
  success: number;
  error: number;
  pending: number;
}

interface SelectedItems {
  [key: string]: boolean;
}

interface CollectionItem {
  _id: string;
  [key: string]: any;
}

type Collections = DatabaseSyncState['collections'];
type CollectionType = keyof DatabaseCollections;

type DatabaseState = DatabaseSyncState;

interface HasId {
  _id: string;
  [key: string]: any;
}

function hasId(item: any): item is HasId {
  return item && typeof item._id === 'string';
}

const calculateSummary = (data: any[]): DataSummary => {
  return {
    total: data.length,
    success: data.filter((item) => item.status === 'confirmed' || item.status === 'active').length,
    error: data.filter((item) => item.status === 'rejected' || item.status === 'inactive').length,
    pending: 0,
  };
};

const SummaryRow = ({ summary }: { summary: DataSummary }) => (
  <div className={styles.summaryRow}>
    <div className={styles.summaryItem}>
      <span className={styles.summaryLabel}>Total:</span>
      <span className={styles.summaryValue}>{summary.total}</span>
    </div>
    <div className={styles.summaryItem}>
      <span className={styles.summaryLabel}>Success:</span>
      <span className={styles.summaryValue}>{summary.success}</span>
    </div>
    <div className={styles.summaryItem}>
      <span className={styles.summaryLabel}>Error:</span>
      <span className={styles.summaryValue}>{summary.error}</span>
    </div>
    <div className={styles.summaryItem}>
      <span className={styles.summaryLabel}>Pending:</span>
      <span className={styles.summaryValue}>{summary.pending}</span>
    </div>
  </div>
);

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
};

export default function ShowData() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DataTab>('all');
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({});
  const [editingItem, setEditingItem] = useState<{
    data: any;
    type: CollectionType | null;
  } | null>(null);
  const state = useDbSync();
  const { connected, error, collections } = state as DatabaseState;

  const refreshData = async () => {
    try {
      const response = await fetch('/api/database-info', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh data');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to refresh data');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      throw error; // Re-throw to be handled by the caller
    }
  };

  const handleDelete = async (type: 'users' | 'votes' | 'logos', id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/${type}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${type.slice(0, -1)}`);
      }

      // Clear the item from selected items after successful deletion
      const newSelectedItems = { ...selectedItems };
      delete newSelectedItems[id];
      setSelectedItems(newSelectedItems);
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Error deleting ${type.slice(0, -1)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = async (type: 'users' | 'votes' | 'logos') => {
    const itemsToDelete = Object.entries(selectedItems)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    if (itemsToDelete.length === 0) {
      alert('No items selected for deletion');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${itemsToDelete.length} selected ${type}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const results = await Promise.all(
        itemsToDelete.map((id) =>
          fetch(`/api/${type}/${id}`, {
            method: 'DELETE',
          })
        )
      );

      const failedDeletions = results.filter((r) => !r.ok).length;
      if (failedDeletions > 0) {
        alert(`Failed to delete ${failedDeletions} items`);
      }

      // Clear all selected items after deletion
      setSelectedItems({});
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Error during bulk deletion');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAllItems = (type: CollectionType) => {
    const items = collections[type].data;
    const currentIds = items.filter(hasId).map((item) => item._id);

    // Create new state object with toggled values
    const newSelectedItems: SelectedItems = { ...selectedItems };

    // Check if all items in this section are selected
    const allSelected = currentIds.every((id) => {
      const key = String(id);
      return selectedItems[key] === true;
    });

    // If all are selected, unselect all. If some or none are selected, select all
    currentIds.forEach((id) => {
      const key = String(id);
      newSelectedItems[key] = !allSelected;
    });

    setSelectedItems(newSelectedItems);
  };

  const handleEdit = async (type: 'users' | 'votes' | 'logos', data: any) => {
    setEditingItem({ data, type });
  };

  const handleSaveEdit = async (updatedData: any) => {
    if (!editingItem?.type) return;

    try {
      const response = await fetch(`/api/${editingItem.type}/${updatedData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update ${editingItem.type}`);
      }

      // Refresh data after successful update
      await refreshData();

      // The WebSocket connection will automatically update the UI when the database changes
      setEditingItem(null);
    } catch (error) {
      console.error('Update error:', error);
      alert(
        `Error updating ${editingItem.type}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const renderSectionHeader = (type: CollectionType, title: string) => {
    const hasSelectedItems = Object.values(selectedItems).some((isSelected) => isSelected);
    const items = collections[type].data;
    const currentIds = items.filter(hasId).map((item) => item._id);
    const allSelected =
      currentIds.length > 0 &&
      currentIds.every((id) => {
        const key = String(id);
        return selectedItems[key] === true;
      });

    return (
      <div className={styles.sectionHeader}>
        <h2>{title}</h2>
        <div className={styles.headerActions}>
          <button
            className={styles.toggleButton}
            onClick={() => toggleAllItems(type)}
            disabled={items.length === 0}
          >
            {allSelected ? 'Unselect All' : 'Select All'}
          </button>
          <button
            className={`${styles.deleteButton} ${styles.deleteAllButton}`}
            onClick={() => handleDeleteSelected(type)}
            disabled={isDeleting || !hasSelectedItems}
          >
            {isDeleting ? 'Deleting...' : 'Delete Selected'}
          </button>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className={styles.container}>
        <h1>Error</h1>
        <p className={styles.error}>{error.message}</p>
      </div>
    );
  }

  const renderContent = () => {
    if (!connected) {
      return <div className={styles.loading}>Loading data...</div>;
    }

    const renderUserRow = (user: IUser & HasId) => (
      <div key={user._id} className={styles.dataRow}>
        <div className={styles.rowActions}>
          <input
            type="checkbox"
            checked={selectedItems[user._id] || false}
            onChange={() => toggleItemSelection(user._id)}
            className={styles.checkbox}
          />
          <button className={styles.editButton} onClick={() => handleEdit('users', user)}>
            Edit
          </button>
          <button
            className={styles.deleteButton}
            onClick={() => handleDelete('users', user._id)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
    );

    const renderVoteRow = (vote: IVote & HasId) => (
      <tr key={vote._id} className={styles.dataRow}>
        <td>
          <input
            type="checkbox"
            checked={selectedItems[vote._id] || false}
            onChange={() => toggleItemSelection(vote._id)}
          />
        </td>
        <td>{vote._id}</td>
        <td>{vote.userId}</td>
        <td>{vote.logoId}</td>
        <td>{formatDate(vote.timestamp)}</td>
        <td>{vote.status}</td>
        <td>{formatDate(vote.createdAt)}</td>
        <td className={styles.actions}>
          <button onClick={() => handleEdit('votes', vote)} className={styles.editButton}>
            Edit
          </button>
          <button
            onClick={() => handleDelete('votes', vote._id)}
            className={styles.deleteButton}
            disabled={isDeleting}
          >
            Delete
          </button>
        </td>
      </tr>
    );

    const renderLogoCard = (logo: ILogo & HasId) => (
      <div key={logo._id} className={styles.logoCard}>
        <div className={styles.logoCheckbox}>
          <input
            type="checkbox"
            checked={selectedItems[logo._id] || false}
            onChange={() => toggleItemSelection(logo._id)}
          />
        </div>
        <div className={styles.logoImage}>
          <Image
            src={logo.src}
            alt={logo.alt}
            width={100}
            height={100}
            className={styles.logoImg}
          />
        </div>
        <div className={styles.logoInfo}>
          <p>
            <strong>ID:</strong> {logo.id}
          </p>
          <p>
            <strong>Alt:</strong> {logo.alt}
          </p>
          <p>
            <strong>Owner:</strong> {logo.ownerId}
          </p>
          <p>
            <strong>Status:</strong> {logo.status}
          </p>
          <p>
            <strong>Content Type:</strong> {logo.contentType || 'N/A'}
          </p>
          <p>
            <strong>Created:</strong> {formatDate(logo.createdAt)}
          </p>
        </div>
        <div className={styles.logoActions}>
          <button onClick={() => handleEdit('logos', logo)} className={styles.editButton}>
            Edit
          </button>
          <button
            onClick={() => handleDelete('logos', logo._id)}
            className={styles.deleteButton}
            disabled={isDeleting}
          >
            Delete
          </button>
        </div>
      </div>
    );

    switch (activeTab) {
      case 'users':
        return (
          <div className={styles.section}>
            {renderSectionHeader('users', 'Users')}
            <SummaryRow summary={calculateSummary(collections.users.data)} />
            <div className={styles.dataTable}>
              <table>
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Data</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.users.data
                    .filter(hasId)
                    .map((item) => (
                      <tr key={item._id} className={styles.dataRow}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedItems[item._id] || false}
                            onChange={() => toggleItemSelection(item._id)}
                            className={styles.checkbox}
                          />
                        </td>
                        <td>
                          <pre>{JSON.stringify(item, null, 2)}</pre>
                        </td>
                        <td className={styles.rowActions}>
                          <button className={styles.editButton} onClick={() => handleEdit('users', item)}>
                            Edit
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDelete('users', item._id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'votes':
        return (
          <div className={styles.section}>
            {renderSectionHeader('votes', 'Votes')}
            <SummaryRow summary={calculateSummary(collections.votes.data)} />
            <div className={styles.dataTable}>
              <table>
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>ID</th>
                    <th>User ID</th>
                    <th>Logo ID</th>
                    <th>Timestamp</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.votes.data
                    .filter(hasId)
                    .map((item) => renderVoteRow(item as IVote & HasId))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'logos':
        return (
          <div className={styles.section}>
            {renderSectionHeader('logos', 'Logos')}
            <SummaryRow summary={calculateSummary(collections.logos.data)} />
            <div className={styles.logosGrid}>
              {collections.logos.data
                .filter(hasId)
                .map((item) => renderLogoCard(item as ILogo & HasId))}
              {collections.logos.data.length === 0 && (
                <p className={styles.noData}>No logos available</p>
              )}
            </div>
          </div>
        );
      case 'all':
      default:
        return (
          <div className={styles.dataContainer}>
            <div className={styles.section}>
              {renderSectionHeader('users', 'Users')}
              <SummaryRow summary={calculateSummary(collections.users.data)} />
              <div className={styles.dataTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Data</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collections.users.data
                      .filter(hasId)
                      .map((item) => (
                        <tr key={item._id} className={styles.dataRow}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedItems[item._id] || false}
                              onChange={() => toggleItemSelection(item._id)}
                              className={styles.checkbox}
                            />
                          </td>
                          <td>
                            <pre>{JSON.stringify(item, null, 2)}</pre>
                          </td>
                          <td className={styles.rowActions}>
                            <button className={styles.editButton} onClick={() => handleEdit('users', item)}>
                              Edit
                            </button>
                            <button
                              className={styles.deleteButton}
                              onClick={() => handleDelete('users', item._id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.section}>
              {renderSectionHeader('votes', 'Votes')}
              <SummaryRow summary={calculateSummary(collections.votes.data)} />
              <div className={styles.dataTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>ID</th>
                      <th>User ID</th>
                      <th>Logo ID</th>
                      <th>Timestamp</th>
                      <th>Status</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collections.votes.data
                      .filter(hasId)
                      .map((item) => renderVoteRow(item as IVote & HasId))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.section}>
              {renderSectionHeader('logos', 'Logos')}
              <SummaryRow summary={calculateSummary(collections.logos.data)} />
              <div className={styles.logosGrid}>
                {collections.logos.data
                  .filter(hasId)
                  .map((item) => renderLogoCard(item as ILogo & HasId))}
                {collections.logos.data.length === 0 && (
                  <p className={styles.noData}>No logos available</p>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      <h1>Database Data - {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}</h1>

      <div className={styles.controls}>
        <div className={styles.statusIndicator}>{!connected ? 'Connecting...' : 'Connected'}</div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('all')}
            disabled={!connected}
          >
            All Data
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'users' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('users')}
            disabled={!connected}
          >
            Users
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'votes' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('votes')}
            disabled={!connected}
          >
            Votes
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'logos' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('logos')}
            disabled={!connected}
          >
            Logos
          </button>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.uploadButton}
            onClick={() => setIsUploadModalOpen(true)}
            disabled={!connected}
          >
            Upload Logo
          </button>

          <button
            className={styles.exportButton}
            onClick={() => exportToJson(collections)}
            disabled={!connected}
          >
            Export JSON
          </button>

          <button
            className={styles.exportButton}
            onClick={() => exportToCsv(collections)}
            disabled={!connected}
          >
            Export CSV
          </button>
        </div>
      </div>

      {renderContent()}

      {editingItem && (
        <DataEditModal
          data={editingItem.data}
          type={editingItem.type}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdit}
        />
      )}

      {isUploadModalOpen && (
        <LogoUploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => {
            setIsUploadModalOpen(false);
            // The data will be automatically updated through the database sync
          }}
        />
      )}
    </div>
  );
}

function exportToJson(data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `database-data-${new Date().toISOString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportToCsv(collections: Collections) {
  let csvContent = 'data:text/csv;charset=utf-8,';

  for (const [name, collection] of Object.entries(collections)) {
    if (Array.isArray(collection.data)) {
      csvContent += `\n${name.toUpperCase()}\n`;
      if (collection.data.length > 0) {
        const headers = Object.keys(collection.data[0]).join(',');
        csvContent += headers + '\n';
        collection.data.filter(hasId).forEach((item) => {
          const row = Object.values(item).join(',');
          csvContent += row + '\n';
        });
      }
    }
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'database_export.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
