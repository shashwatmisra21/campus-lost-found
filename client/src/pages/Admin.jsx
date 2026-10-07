import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Admin() {
  const [claims, setClaims] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);

      const [claimsRes, itemsRes] = await Promise.all([
        api.get('/admin/claims'),
        api.get('/admin/items'),
      ]);

      setClaims(claimsRes.data.claims || []);
      setItems(itemsRes.data.items || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const reviewClaim = async (claimId, action) => {
    try {
      const notes = window.prompt(
        action === 'approve'
          ? 'Optional approval note:'
          : 'Reason for rejecting this claim:'
      );

      if (action === 'approve') {
        await api.put(`/admin/claims/${claimId}/approve`, {
          adminNotes: notes || '',
        });
      } else {
        await api.put(`/admin/claims/${claimId}/reject`, {
          adminNotes: notes || '',
        });
      }

      setMessage(
        action === 'approve'
          ? 'Claim approved successfully.'
          : 'Claim rejected successfully.'
      );

      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const markReturned = async (itemId) => {
    try {
      await api.put(`/admin/items/${itemId}/returned`);

      setMessage('Item marked as returned.');

      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (loading) {
    return (
      <main className="page-shell">
        <section className="page-card">
          <p>Loading admin dashboard...</p>
        </section>
      </main>
    );
  }

  const openClaims = claims.filter((claim) =>
    ['pending', 'under_review', 'suspicious'].includes(claim.status)
  );

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">Moderator tools</p>
          <h1>Admin Dashboard</h1>
          <p>
            Review claims, investigate suspicious submissions, and manage
            returned items.
          </p>
        </div>
      </section>

      {message && (
        <div className="notice">
          {message}
        </div>
      )}

      <section className="page-card">
        <div className="section-heading">
          <div>
            <h2>Claims requiring review</h2>
            <p>{openClaims.length} open claim(s)</p>
          </div>
        </div>

        {openClaims.length === 0 ? (
          <p>No claims currently require review.</p>
        ) : (
          <div className="admin-list">
            {openClaims.map((claim) => (
              <article className="admin-claim" key={claim._id}>
                <div className="admin-claim-header">
                  <div>
                    <h3>
                      {claim.item?.title || 'Unknown item'}
                    </h3>

                    <p>
                      Claimant:{' '}
                      <strong>
                        {claim.claimant?.name || 'Unknown'}
                      </strong>
                    </p>

                    <p>
                      {claim.claimant?.email || ''}
                    </p>
                  </div>

                  <div className="claim-score">
                    <strong>{claim.confidenceScore}%</strong>
                    <span>confidence</span>
                  </div>
                </div>

                <div className="claim-meta">
                  <span>Status: {claim.status}</span>
                  <span>Risk: {claim.riskLevel}</span>
                </div>

                {claim.matchedFields?.length > 0 && (
                  <div>
                    <strong>Matched fields</strong>
                    <ul>
                      {claim.matchedFields.map((field) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {claim.suspiciousFields?.length > 0 && (
                  <div>
                    <strong>Suspicious fields</strong>
                    <ul>
                      {claim.suspiciousFields.map((field) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="verification-box">
                  <strong>Claimant's verification answers</strong>

                  <p>
                    <b>Unique marks:</b>{' '}
                    {claim.answers?.uniqueMarks || 'Not provided'}
                  </p>

                  <p>
                    <b>Contents:</b>{' '}
                    {claim.answers?.contents || 'Not provided'}
                  </p>

                  <p>
                    <b>Hidden details:</b>{' '}
                    {claim.answers?.hiddenDetails || 'Not provided'}
                  </p>

                  <p>
                    <b>Extra notes:</b>{' '}
                    {claim.answers?.extraNotes || 'Not provided'}
                  </p>
                </div>

                <div className="admin-actions">
                  <button
                    className="button button-primary"
                   onClick={() => reviewClaim(claim.id, 'approve')}
                  >
                    Approve claim
                  </button>

                  <button
                    className="button button-secondary"
                   onClick={() => reviewClaim(claim.id, 'reject')}
                  >
                    Reject claim
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="page-card">
        <div className="section-heading">
          <div>
            <h2>Reported items</h2>
            <p>Manage found items and returned items.</p>
          </div>
        </div>

        {items.length === 0 ? (
          <p>No items found.</p>
        ) : (
          <div className="admin-list">
            {items.map((item) => (
              <article className="admin-item" key={item._id}>
                <div>
                  <h3>{item.title}</h3>

                  <p>
                    Type: {item.type}
                  </p>

                  <p>
                    Status: <strong>{item.status}</strong>
                  </p>

                  {item.reporter && (
                    <p>
                      Reported by: {item.reporter.name}
                    </p>
                  )}
                </div>

                {item.type === 'found' && item.status !== 'returned' && (
                  <button
                    className="button button-primary"
                    onClick={() => markReturned(item.id)}
                  >
                    Mark returned
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}