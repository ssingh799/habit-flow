import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserSearch } from '@/components/UserSearch';
import { ChatRequests } from '@/components/ChatRequests';
import { ChatList } from '@/components/ChatList';
import { ChatWindow } from '@/components/ChatWindow';
import { useChat } from '@/hooks/useChat';
import { ArrowLeft, MessageSquare, Search, Bell, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const { conversations, chatRequests } = useChat();

  const selectedConvo = conversations.find((c) => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Chat</h1>
          </div>
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Find Users
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Search Users</DialogTitle>
              </DialogHeader>
              <UserSearch onClose={() => setSearchOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
          {/* Sidebar */}
          <div className={`lg:col-span-1 ${selectedConvo ? 'hidden lg:block' : ''}`}>
            <Card className="h-full">
              <CardContent className="p-0 h-full flex flex-col">
                <Tabs defaultValue="chats" className="flex flex-col h-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                    <TabsTrigger value="chats" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Chats
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="flex items-center gap-2 relative">
                      <Bell className="h-4 w-4" />
                      Requests
                      {chatRequests.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {chatRequests.length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="chats" className="flex-1 overflow-y-auto p-4 m-0">
                    <ChatList
                      selectedConversation={selectedConversation}
                      onSelectConversation={setSelectedConversation}
                    />
                  </TabsContent>
                  <TabsContent value="requests" className="flex-1 overflow-y-auto p-4 m-0">
                    <ChatRequests />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Chat Window */}
          <div className={`lg:col-span-2 ${!selectedConvo ? 'hidden lg:block' : ''}`}>
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                {selectedConvo ? (
                  <ChatWindow
                    conversation={selectedConvo}
                    onBack={() => setSelectedConversation(null)}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Users className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-lg">Select a conversation to start chatting</p>
                    <p className="text-sm mt-2">
                      Or search for users to send a chat request
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
