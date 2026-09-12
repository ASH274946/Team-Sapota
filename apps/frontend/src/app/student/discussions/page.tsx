'use client';

import { useState } from 'react';
import { PageHeader } from '@/design-system/PageHeader';
import { Card } from '@/design-system/Card';
import { Button } from '@/design-system/Button';
import { MessageSquare, Sparkles, Send, ThumbsUp, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Post {
  id: string;
  author: string;
  avatar: string;
  role: 'STUDENT' | 'TEACHER' | 'AI';
  content: string;
  time: string;
  likes: number;
  isVerified?: boolean;
  replies?: Post[];
}

const MOCK_FORUM: Post[] = [
  {
    id: '1',
    author: 'Alice Smith',
    avatar: 'A',
    role: 'STUDENT',
    content: 'Can someone explain how the backpropagation algorithm works intuitively? I am struggling to understand the chain rule part.',
    time: '2 hours ago',
    likes: 5,
    replies: [
      {
        id: '2',
        author: 'Prof. Johnson',
        avatar: 'J',
        role: 'TEACHER',
        content: 'Think of backpropagation as asking each neuron: "Who is responsible for this error?" The chain rule just helps us multiply those responsibilities backwards through the layers. I highly recommend reviewing Chapter 4 of the textbook.',
        time: '1 hour ago',
        likes: 12,
        isVerified: true
      },
      {
        id: '3',
        author: 'AI Teaching Assistant',
        avatar: '🤖',
        role: 'AI',
        content: 'Here is an intuitive analogy: Imagine a team building a house. If the roof leaks (the error), the manager yells at the roofers, who then yell at the carpenters who built the frame. The chain rule mathematically distributes the "blame" proportional to how much each layer contributed to the final output.',
        time: '55 mins ago',
        likes: 8,
        isVerified: true
      }
    ]
  }
];

export default function StudentDiscussionsPage() {
  const [posts, setPosts] = useState<Post[]>(MOCK_FORUM);
  const [newPost, setNewPost] = useState('');

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const post: Post = {
      id: Date.now().toString(),
      author: 'You',
      avatar: 'Y',
      role: 'STUDENT',
      content: newPost,
      time: 'Just now',
      likes: 0,
      replies: []
    };

    setPosts([post, ...posts]);
    setNewPost('');
    toast.success('Discussion posted!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Course Discussions"
        subtitle="Collaborate with your peers, teachers, and AI assistants."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding="16px">
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: '0 0 12px 0' }}>Channels</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ padding: '8px 12px', background: 'var(--brand-light)', color: 'var(--brand)', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}># general</div>
              <div style={{ padding: '8px 12px', color: 'var(--text-secondary)', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}># assignment-3</div>
              <div style={{ padding: '8px 12px', color: 'var(--text-secondary)', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}># midterm-prep</div>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* New Post Area */}
          <Card padding="20px">
            <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <textarea 
                placeholder="Start a new discussion..."
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: 8, resize: 'none', outline: 'none', fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  toast.success('AI is analyzing your post...');
                  setTimeout(() => setNewPost('Can someone explain how the backpropagation algorithm works intuitively? I am struggling to understand the chain rule part. (Enhanced for clarity by AI)'), 1000);
                }}>
                  <Sparkles size={14} style={{ marginRight: 6 }} /> Improve with AI
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  <Send size={14} style={{ marginRight: 6 }} /> Post
                </Button>
              </div>
            </form>
          </Card>

          {/* Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {posts.map((post) => (
              <Card key={post.id} padding="24px">
                {/* Main Post */}
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {post.avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{post.author}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{post.time}</span>
                    </div>
                    <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {post.content}
                    </p>
                    <div style={{ display: 'flex', gap: 16, color: 'var(--text-muted)' }}>
                      <button style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'inherit', padding: 0 }}>
                        <ThumbsUp size={16} /> <span style={{ fontSize: 'var(--text-sm)' }}>{post.likes}</span>
                      </button>
                      <button style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'inherit', padding: 0 }}>
                        <MessageSquare size={16} /> <span style={{ fontSize: 'var(--text-sm)' }}>Reply</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {post.replies && post.replies.length > 0 && (
                  <div style={{ marginTop: 24, marginLeft: 24, paddingLeft: 24, borderLeft: '2px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {post.replies.map(reply => (
                      <div key={reply.id} style={{ display: 'flex', gap: 16 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: reply.role === 'AI' ? 'var(--brand)' : 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: reply.role === 'AI' ? 'white' : 'var(--text-secondary)', flexShrink: 0 }}>
                          {reply.role === 'AI' ? <Sparkles size={16} /> : reply.avatar}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{reply.author}</span>
                            {reply.isVerified && <CheckCircle2 size={14} color="#10B981" />}
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{reply.time}</span>
                          </div>
                          <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {reply.content}
                          </p>
                          <div style={{ display: 'flex', gap: 16, color: 'var(--text-muted)' }}>
                            <button style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'inherit', padding: 0 }}>
                              <ThumbsUp size={14} /> <span style={{ fontSize: 'var(--text-xs)' }}>{reply.likes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
