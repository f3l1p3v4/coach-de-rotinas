import React from 'react';
import {
  MusicNotes, Timer, Scales, MapTrifold, Hourglass, Target, Link, Rocket, Heart,
  Repeat, Sparkle, Gear, Pencil, PlusCircle, ClipboardText, NotePencil,
  Folder, Tag, CalendarBlank, Lightbulb, Trophy, ChatCircle, Moon, Sun,
  Briefcase, User, BookOpen, Barbell, House, Wallet, CheckCircle, XCircle, Circle, X
} from '@phosphor-icons/react';
import './styles.css';

export const ICON_OPTIONS = [
  ['tag', 'Etiqueta'], ['briefcase', 'Trabalho'], ['user', 'Pessoal'],
  ['book', 'Estudos'], ['barbell', 'Saúde'], ['house', 'Casa'],
  ['wallet', 'Finanças'], ['heart', 'Bem-estar'], ['target', 'Objetivo'],
  ['music', 'Música'], ['note', 'Anotações'], ['calendar', 'Agenda'], ['folder', 'Pasta']
];

const icons = {
  music: [MusicNotes, '#a78bfa'],
  timer: [Timer, '#ef4444'], scales: [Scales, '#a78bfa'], map: [MapTrifold, '#34d399'],
  hourglass: [Hourglass, '#fbbf24'], target: [Target, '#f87171'], link: [Link, '#38bdf8'],
  rocket: [Rocket, '#fb923c'], heart: [Heart, '#f472b6'], repeat: [Repeat, '#2dd4bf'],
  sparkle: [Sparkle, '#fbbf24'], gear: [Gear, '#a78bfa'], pencil: [Pencil, '#38bdf8'],
  plus: [PlusCircle, '#34d399'], clipboard: [ClipboardText, '#fbbf24'], note: [NotePencil, '#38bdf8'],
  folder: [Folder, '#fbbf24'], tag: [Tag, '#a78bfa'], calendar: [CalendarBlank, '#38bdf8'],
  lightbulb: [Lightbulb, '#fbbf24'], trophy: [Trophy, '#fbbf24'], chat: [ChatCircle, '#2dd4bf'],
  moon: [Moon, '#a78bfa'], sun: [Sun, '#fbbf24'], briefcase: [Briefcase, '#60a5fa'],
  user: [User, '#34d399'], book: [BookOpen, '#a78bfa'], barbell: [Barbell, '#fb923c'],
  house: [House, '#f472b6'], wallet: [Wallet, '#34d399'],
  check: [CheckCircle, '#34d399'], failed: [XCircle, '#f87171'], circle: [Circle, '#fbbf24'], close: [X, '#f87171']
};

export default function AppIcon({ name = 'tag', color, size = 20, label, className = '', ...props }) {
  const [Icon, defaultColor] = icons[name] || icons.tag;
  return <Icon {...props} size={size} color={color || defaultColor} weight="duotone"
    className={`app-icon ${className}`.trim()} aria-hidden={label ? undefined : true}
    role={label ? 'img' : undefined} aria-label={label} />;
}
