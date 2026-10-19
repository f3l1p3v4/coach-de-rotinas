import React, { useEffect, useId, useState } from 'react';
import { getStoredProfiles } from '../../constants/profiles';
import IconSelect from '../IconSelect';

export default function ProfilePicker({ profile, onChange }) {
  const id = useId();
  const [profiles, setProfiles] = useState(getStoredProfiles);
  useEffect(() => {
    const refresh = () => setProfiles(getStoredProfiles());
    window.addEventListener('coach-profiles-changed', refresh);
    return () => window.removeEventListener('coach-profiles-changed', refresh);
  }, []);
  return <div className="form-group profile-field">
    <label htmlFor={id}>Perfil</label>
    <IconSelect id={id} label="Perfil" value={profile || ''} onChange={onChange}
      options={[{ value: '', label: 'Sem perfil', icon: 'user' }, ...profiles.map(item => ({ value: item.name, label: item.name, icon: item.icon, color: 'currentColor' }))]} />
  </div>;
}
