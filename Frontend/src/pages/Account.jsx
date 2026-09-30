import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const getProfileValues = (user) => {
  const nameParts = user?.fullName?.split(" ") || [];
  return {
    firstName: user?.firstName || nameParts[0] || "",
    lastName: user?.lastName || nameParts.slice(1).join(" ") || "",
    email: user?.email || "",
  };
};

const inputClassName = "mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white";
const labelClassName = "block text-sm font-medium text-slate-700 dark:text-neutral-300";

export default function Account() {
  const { user, updateProfile, changePassword } = useAuth();
  const [profile, setProfile] = useState(() => getProfileValues(user));
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage("");
    setProfileError("");

    const result = await updateProfile(profile);
    if (result.success) {
      setProfile(getProfileValues(result.data));
      setProfileMessage("Profile updated.");
    } else {
      setProfileError(result.error);
    }
    setProfileSaving(false);
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage("");
    setPasswordError("");

    const result = await changePassword(passwords);
    if (result.success) {
      setPasswords({ currentPassword: "", newPassword: "" });
      setPasswordMessage(result.message);
    } else {
      setPasswordError(result.error);
    }
    setPasswordSaving(false);
  };

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold dark:text-white">Account</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">Update your profile and sign-in security.</p>
      </div>

      <section className="max-w-xl border-y border-slate-200 py-5 dark:border-neutral-800">
        <h2 className="text-sm font-semibold dark:text-white">Profile details</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">Your name and email address are used for your account.</p>
        <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClassName}>
              First name
              <input required minLength="2" maxLength="50" value={profile.firstName} onChange={(event) => setProfile({ ...profile, firstName: event.target.value })} className={inputClassName} />
            </label>
            <label className={labelClassName}>
              Last name
              <input required minLength="2" maxLength="50" value={profile.lastName} onChange={(event) => setProfile({ ...profile, lastName: event.target.value })} className={inputClassName} />
            </label>
          </div>
          <label className={labelClassName}>
            Email address
            <input type="email" required value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} className={inputClassName} />
          </label>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button type="submit" disabled={profileSaving} className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500">
              {profileSaving ? "Saving..." : "Save profile"}
            </button>
            <button type="button" onClick={() => { setProfile(getProfileValues(user)); setProfileMessage(""); setProfileError(""); }} className="px-2 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white">
              Discard changes
            </button>
            {profileMessage && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{profileMessage}</p>}
            {profileError && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{profileError}</p>}
          </div>
        </form>
      </section>

      <section className="max-w-xl border-b border-slate-200 py-5 dark:border-neutral-800">
        <h2 className="text-sm font-semibold dark:text-white">Password</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">Use at least 8 characters with uppercase, lowercase, a number, and a symbol.</p>
        <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
          <label className={labelClassName}>
            Current password
            <input type="password" required autoComplete="current-password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} className={inputClassName} />
          </label>
          <label className={labelClassName}>
            New password
            <input type="password" required minLength="8" autoComplete="new-password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} className={inputClassName} />
          </label>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button type="submit" disabled={passwordSaving} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-900">
              {passwordSaving ? "Updating..." : "Change password"}
            </button>
            {passwordMessage && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{passwordMessage}</p>}
            {passwordError && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{passwordError}</p>}
          </div>
        </form>
      </section>
    </div>
  );
}