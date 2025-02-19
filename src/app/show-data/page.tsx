'use client';

import { useEffect, useState, useMemo } from 'react';
import styles from './styles.module.css';
import LogoModal from './LogoModal';
import DataEditModal from './DataEditModal';
import Image from 'next/image';

interface DatabaseInfo {
  collections: {
    users: any[];
    votes: any[];
    logos: any[];
  };
  schemas: {
    User: any;
    Vote: any;
    Logo: any;
  };
  stats: {
    users: any;
    votes: any;
    logos: any;
  };
}

export default function ShowData() {
  const [data, setData] = useState<DatabaseInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLogo, setSelectedLogo] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editType, setEditType] = useState<'user' | 'logo' | 'vote' | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/database-info');
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch data');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleEdit = (item: any, type: 'user' | 'logo' | 'vote') => {
    setEditItem(item);
    setEditType(type);
    setEditModalOpen(true);
  };

  const handleDelete = async (id: string, type: 'user' | 'logo' | 'vote') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const response = await fetch(`/api/${type}s/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${type}`);
      }

      // Refresh data after deletion
      const updatedResponse = await fetch('/api/database-info');
      const result = await updatedResponse.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch updated data');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting');
    }
  };

  const handleSave = async (editedData: any) => {
    if (!editType) return;

    try {
      const response = await fetch(`/api/${editType}s/${editedData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${editType}`);
      }

      // Refresh data after update
      const updatedResponse = await fetch('/api/database-info');
      const result = await updatedResponse.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch updated data');
      }

      setData(result.data);
      setEditModalOpen(false);
      setEditItem(null);
      setEditType(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating');
    }
  };

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.container}>Error: {error}</div>;
  }

  if (!data) {
    return <div className={styles.container}>No data available</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Database Information</h1>

      <section>
        <h2>Users ({data.collections.users.length})</h2>
        <div className={styles.dataGrid}>
          {data.collections.users.map((user) => (
            <div key={user._id} className={styles.card}>
              <h3>{user.name}</h3>
              <p>ID: {user.id}</p>
              <p>Email: {user.email}</p>
              <p>Vote Count: {user.voteCount}</p>
              <div className={styles.actions}>
                <button onClick={() => handleEdit(user, 'user')} className={styles.editButton}>
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user._id, 'user')}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Logos ({data.collections.logos.length})</h2>
        <div className={styles.dataGrid}>
          {data.collections.logos.map((logo) => (
            <div key={logo._id} className={styles.card}>
              <h3>Logo {logo.id}</h3>
              <Image
                src={logo.src}
                alt={logo.alt}
                width={200}
                height={200}
                className={styles.logoImage}
                onClick={() => setSelectedLogo(logo)}
              />
              <p>Owner ID: {logo.ownerId}</p>
              <p>Status: {logo.status}</p>
              <div className={styles.actions}>
                <button onClick={() => handleEdit(logo, 'logo')} className={styles.editButton}>
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(logo._id, 'logo')}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Votes ({data.collections.votes.length})</h2>
        <div className={styles.dataGrid}>
          {data.collections.votes.map((vote) => (
            <div key={vote._id} className={styles.card}>
              <h3>Vote</h3>
              <p>User ID: {vote.userId}</p>
              <p>Logo ID: {vote.logoId}</p>
              <p>Status: {vote.status}</p>
              <div className={styles.actions}>
                <button onClick={() => handleEdit(vote, 'vote')} className={styles.editButton}>
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(vote._id, 'vote')}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedLogo && <LogoModal logo={selectedLogo} onClose={() => setSelectedLogo(null)} />}

      {editModalOpen && editItem && editType && data?.schemas && (
        <DataEditModal
          data={editItem}
          type={editType}
          schema={
            data.schemas[
              (editType.charAt(0).toUpperCase() + editType.slice(1)) as keyof typeof data.schemas
            ]
          }
          onSave={handleSave}
          onClose={() => {
            setEditModalOpen(false);
            setEditItem(null);
            setEditType(null);
          }}
        />
      )}
    </div>
  );
}
