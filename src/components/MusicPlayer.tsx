import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ListMusic,
  Music,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Slider } from './ui/Slider';
import { listSongs, persistSongOrder, type SongItem } from '@/lib/gallery';
import { NOT_CONFIGURED_MESSAGE } from '@/lib/supabase';

export type { SongItem };

interface PlayerProps {
  adminAllowed?: boolean;
  refreshKey?: number;
  playlistTitle?: string;
  playlistVisible?: boolean;
  playlistStyle?: CSSProperties;
  /** Geseran dan skala dari tabel site_blocks; digabung dengan hasil seret kotak. */
  letak?: CSSProperties;
}

export function MusicPlayer({
  adminAllowed = false,
  refreshKey = 0,
  playlistTitle = 'Daftar Lagu',
  playlistVisible = true,
  playlistStyle,
  letak,
}: PlayerProps) {
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0, isDragging: false });

  useEffect(() => {
    if (NOT_CONFIGURED_MESSAGE) return;
    let active = true;
    void listSongs().then(list => {
      if (active) setSongs(list);
    });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const currentSong = songs[currentIndex];

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.volume = isMuted ? 0 : volume;

    const handleEnded = () => setCurrentIndex(prev => (songs.length ? (prev + 1) % songs.length : 0));
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [songs.length, volume, isMuted]);

  // Ganti sumber audio saat lagu aktif berganti.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    audio.src = currentSong.file_url;
    audio.load();
    if (isPlaying) void audio.play().catch(() => setIsPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.id]);

  // Musik tidak pernah menyala sendiri: pengunjung yang menekan tombol putar,
  // jadi tidak ada suara yang muncul tiba-tiba saat halaman baru dibuka.
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = isLooping;
  }, [isLooping]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(error => console.error(error));
    }
  };

  const stopSong = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  };

  const nextSong = () => {
    if (!songs.length) return;
    setCurrentIndex(prev => (prev + 1) % songs.length);
  };

  const prevSong = () => {
    if (!songs.length) return;
    setCurrentIndex(prev => (prev - 1 + songs.length) % songs.length);
  };

  const handleVolumeChange = (newValue: number[]) => {
    const val = newValue[0] ?? 0.7;
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
    if (val > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.closest('.music-player')?.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: rect ? rect.left : 12,
      posY: rect ? rect.top : window.innerHeight - 80,
      isDragging: true,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    // Posisi dikunci agar kotak musik tidak pernah keluar dari layar.
    const newX = Math.max(8, Math.min(window.innerWidth - 120, dragRef.current.posX + dx));
    const newY = Math.max(8, Math.min(window.innerHeight - 60, dragRef.current.posY + dy));
    setPosition({ x: newX, y: newY });
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer sudah terlepas sendiri */
    }
  }

  // Urutan hanya disimpan permanen untuk admin; pengunjung bisa menata sementara.
  function reorderSongs(fromId: string, toId: string) {
    if (fromId === toId) return;
    const from = songs.findIndex(s => s.id === fromId);
    const to = songs.findIndex(s => s.id === toId);
    if (from < 0 || to < 0) return;

    const next = [...songs];
    const moved = next[from];
    if (!moved) return;
    next.splice(from, 1);
    next.splice(to, 0, moved);

    const currentId = currentSong?.id;
    setSongs(next);
    if (currentId) setCurrentIndex(Math.max(0, next.findIndex(s => s.id === currentId)));
    if (!adminAllowed) return;
    void persistSongOrder(next).catch(error => console.error(error));
  }

  if (!songs.length) return null;

  return (
    <>
      <div
        className={`music-player fixed z-40 ${position ? '' : 'bottom-4 left-3'} ${isCollapsed ? 'w-auto' : 'max-w-[calc(100vw-24px)]'}`}
        style={position ? { ...letak, left: `${position.x}px`, top: `${position.y}px`, bottom: 'auto' } : letak}
      >
        {isCollapsed ? (
          <button
            onClick={() => setIsCollapsed(false)}
            title="Buka pemutar musik"
            className="group flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-2 shadow-xl backdrop-blur-md transition-transform hover:bg-secondary/70 active:scale-95"
          >
            <div className="relative flex items-center justify-center">
              <Music className={`size-4 text-primary ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
              {isPlaying && <span className="absolute -top-1 -right-1 size-2 animate-ping rounded-full bg-primary" />}
            </div>
            <span className="max-w-[80px] truncate text-xs font-medium text-foreground sm:max-w-[120px]">
              {currentSong?.title || 'Musik'}
            </span>
            <div className="rounded-full bg-secondary p-0.5 text-muted-foreground transition-colors group-hover:bg-primary/20 group-hover:text-primary">
              <ChevronRight className="size-3.5" />
            </div>
          </button>
        ) : (
          <div className="flex max-w-full flex-col gap-1.5 rounded-2xl border border-border bg-background/95 p-2 shadow-2xl backdrop-blur-md sm:p-2.5">
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              title="Tahan dan geser untuk memindahkan posisi"
              className="flex min-w-0 touch-none cursor-grab items-center gap-1.5 border-b border-border/60 px-1.5 pb-1.5 select-none active:cursor-grabbing"
            >
              <Music className={`size-4 shrink-0 text-primary ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
              <span className="truncate text-[11px] font-medium text-foreground sm:text-xs">
                {currentSong?.title || 'Memuat...'}
              </span>
              <GripVertical className="ml-auto size-3.5 shrink-0 text-muted-foreground opacity-50" />
            </div>

            <div className="scrollbar-none flex items-center gap-1 overflow-x-auto sm:gap-2">
              <Button variant="ghost" size="icon" className="size-7 shrink-0 rounded-full" title="Lagu sebelumnya" onClick={prevSong} disabled={songs.length <= 1}>
                <SkipBack className="size-3.5" />
              </Button>
              <Button variant="default" size="icon" className="size-7 shrink-0 rounded-full shadow-sm sm:size-8" title={isPlaying ? 'Jeda musik' : 'Putar musik'} onClick={togglePlay}>
                {isPlaying ? <Pause className="size-3.5 sm:size-4" /> : <Play className="ml-0.5 size-3.5 sm:size-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="size-7 shrink-0 rounded-full" title="Stop musik" onClick={stopSong}>
                <Square className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7 shrink-0 rounded-full" title="Lagu berikutnya" onClick={nextSong} disabled={songs.length <= 1}>
                <SkipForward className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`size-7 shrink-0 rounded-full transition-colors ${isLooping ? 'bg-primary/20 font-bold text-primary' : 'text-muted-foreground'}`}
                title={isLooping ? 'Muter terus aktif (Repeat ON)' : 'Muter terus nonaktif (Repeat OFF)'}
                onClick={() => setIsLooping(v => !v)}
              >
                <Repeat className="size-3.5" />
              </Button>

              <div className="mx-0.5 h-4 w-px shrink-0 bg-border/60" />

              <Button variant="ghost" size="icon" className="size-7 shrink-0 rounded-full" title={isMuted ? 'Nyalakan suara (Unmute)' : 'Bisukan suara (Mute)'} onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeX className="size-3.5 text-destructive" /> : <Volume2 className="size-3.5 text-primary" />}
              </Button>
              <div className="flex w-14 shrink-0 items-center px-1 sm:w-20">
                <Slider min={0} max={1} step={0.01} value={[isMuted ? 0 : volume]} onValueChange={handleVolumeChange} aria-label="Volume musik" className="cursor-pointer" />
              </div>
              <Button variant="ghost" size="icon" className={`size-7 shrink-0 rounded-full ${showPlaylist ? 'bg-secondary text-primary' : ''}`} title="Daftar lagu" onClick={() => setShowPlaylist(v => !v)}>
                <ListMusic className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="ml-0.5 size-7 shrink-0 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground"
                title="Perkecil ke samping"
                onClick={() => {
                  setIsCollapsed(true);
                  setShowPlaylist(false);
                }}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {showPlaylist && !isCollapsed && (
        <div className="fixed bottom-24 left-3 z-40 w-72 max-w-[calc(100vw-24px)] animate-in rounded-2xl border border-border bg-background/95 p-3.5 shadow-2xl backdrop-blur-md fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <ListMusic className="size-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                {playlistVisible && <span style={playlistStyle}>{playlistTitle} </span>}({songs.length})
              </span>
            </div>
            {adminAllowed && songs.length > 1 && <span className="pr-9 text-[10px] text-muted-foreground">Tarik untuk mengurutkan</span>}
            <Button variant="ghost" size="icon" className="size-6 rounded-full" onClick={() => setShowPlaylist(false)}>
              <X className="size-3" />
            </Button>
          </div>

          <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
            {songs.map((song, idx) => {
              const active = idx === currentIndex;
              return (
                <button
                  key={song.id}
                  draggable={adminAllowed}
                  onDragStart={() => setDragId(song.id)}
                  onDragOver={e => {
                    if (!dragId || dragId === song.id) return;
                    e.preventDefault();
                    setDragOverId(song.id);
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    if (dragId && dragId !== song.id) reorderSongs(dragId, song.id);
                    setDragId(null);
                    setDragOverId(null);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setDragOverId(null);
                  }}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                    dragOverId === song.id
                      ? 'bg-secondary ring-1 ring-primary'
                      : dragId === song.id
                        ? 'opacity-50'
                        : active
                          ? 'bg-primary/15 font-semibold text-primary'
                          : 'text-foreground hover:bg-secondary'
                  } ${adminAllowed ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  <div className="flex min-w-0 items-center gap-2 truncate">
                    {adminAllowed && <GripVertical className="size-3 shrink-0 text-muted-foreground" />}
                    <span className="w-4 font-mono text-[10px] text-muted-foreground">{idx + 1}.</span>
                    <span className="truncate">{song.title}</span>
                  </div>
                  {active && isPlaying && <span className="size-2 shrink-0 animate-ping rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
