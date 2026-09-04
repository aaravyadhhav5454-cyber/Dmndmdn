import React, { useState } from 'react';
import {
  BookUser,
  Phone,
  Plus,
  Trash2,
  X,
  UserCheck,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { Contact } from '../types';

interface ContactsManagerProps {
  contacts: Contact[];
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  onDirectCall: (name: string) => void;
}

export const ContactsManager: React.FC<ContactsManagerProps> = ({
  contacts,
  isOpen,
  onClose,
  onAddContact,
  onDeleteContact,
  onDirectCall,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newRelation, setNewRelation] = useState('');

  if (!isOpen) return null;

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.number.includes(q) ||
      (c.relation || '').toLowerCase().includes(q)
    );
  });

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newNumber.trim()) return;

    onAddContact({
      id: 'c_' + Date.now(),
      name: newName.trim(),
      number: newNumber.trim(),
      relation: newRelation.trim() || undefined,
      category: 'friends',
    });

    setNewName('');
    setNewNumber('');
    setNewRelation('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl p-4 sm:p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookUser className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">
              Address Book & Speed Dial
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Note */}
        <div className="my-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
          <p className="font-medium text-amber-300 mb-1">
            Indian Context & Contact Disambiguation:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-400">
            <li>
              Saying <span className="text-slate-200 font-mono">"Mummy ko call karo"</span> automatically resolves to{' '}
              <strong className="text-slate-200">Mom</strong>.
            </li>
            <li>
              Saying <span className="text-slate-200 font-mono">"Call Rahul"</span> finds 2 Rahuls and asks which one to call.
            </li>
          </ul>
        </div>

        {/* Search Bar */}
        <div className="relative my-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts by name, number, or relation..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Add Contact Button / Form */}
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-1.5 w-full py-2 my-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add New Contact</span>
          </button>
        ) : (
          <form
            onSubmit={handleCreateContact}
            className="my-3 p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-col gap-2 animate-in fade-in duration-150"
          >
            <h4 className="text-xs font-bold text-slate-200">New Contact</h4>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name (e.g. Rahul, Auntie)"
              className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
            />
            <input
              type="tel"
              required
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder="Phone (e.g. +91 98765 00000)"
              className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
            />
            <input
              type="text"
              value={newRelation}
              onChange={(e) => setNewRelation(e.target.value)}
              placeholder="Relation / Aliases (e.g. Cousin, Chacha)"
              className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
            />
            <div className="flex gap-2 mt-1">
              <button
                type="submit"
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 mt-2">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {contact.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-slate-100 truncate">
                    {contact.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {contact.number}
                  </p>
                  {contact.relation && (
                    <span className="text-[10px] text-amber-400/90 truncate block">
                      {contact.relation}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onDirectCall(contact.name)}
                  className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                  title={`Call ${contact.name} via Arushi`}
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
                {contact.id.startsWith('c_') && (
                  <button
                    onClick={() => onDeleteContact(contact.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredContacts.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-500">
              No contacts matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
