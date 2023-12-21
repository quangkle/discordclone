import { redirectToSignIn } from '@clerk/nextjs';
import { ChannelType, MemberRole } from '@prisma/client';
import { redirect } from 'next/navigation';
import { Hash, Mic, ShieldAlert, ShieldCheck, Video } from 'lucide-react';

import { currentProfile } from '@/lib/current-profile';
import { db } from '@/lib/db';
import ServerHeader from './server-header';
import { ScrollArea } from '../ui/scroll-area';
import ServerSearch from './server-search';
import { Separator } from '../ui/separator';
import ServerSection from './server-section';
import ServerChannel from './server-channel';

interface ServerSidebarProps {
    serverId: string;
}

const iconMap = {
    [ChannelType.TEXT]: <Hash className='h-4 w-4 mr-2' />,
    [ChannelType.AUDIO]: <Mic className='h-4 w-4 mr-2' />,
    [ChannelType.VIDEO]: <Video className='h-4 w-4 mr-2' />
}

const roleIconMap = {
    [MemberRole.GUEST]: null,
    [MemberRole.MODERATOR]: <ShieldCheck className='h-4 w-4 mr-2 text-indigo-500' />,
    [MemberRole.ADMIN]: <ShieldAlert className='h-4 w-4 mr-2 text-rose-500' />,
}

const ServerSidebar = async ({
    serverId
}: ServerSidebarProps) => {
    const profile = await currentProfile();

    if (!profile) {
        return redirectToSignIn();
    }

    const server = await db.server.findUnique({
        where: {
            id: serverId
        },
        include: {
            channels: {
                orderBy: {
                    createdAt: "asc"
                }
            },
            members: {
                include: {
                    profile: true
                },
                orderBy: {
                    role: "asc"
                }
            }
        }
    });

    if (!server) {
        return redirect("/");
    }

    const textChannels = server?.channels.filter((channel) => channel.type === ChannelType.TEXT);
    const audioChannels = server?.channels.filter((channel) => channel.type === ChannelType.AUDIO);
    const videoChannels = server?.channels.filter((channel) => channel.type === ChannelType.VIDEO);
    const members = server?.members.filter((member) => member.profileId !== profile.id);

    const role = server.members.find((member) => member.profileId === profile.id)?.role;

    return (
        <div className='flex flex-col h-full text-primary w-full dark:bg-[#2B2D31] bg-[#F2F3F5]'>
            <ServerHeader
                server={server}
                role={role}
            />

            <ScrollArea className='flex-1 px-3'>
                <div className='mt-2'>
                    <ServerSearch 
                        data={[
                            {
                                label: "Text Channels",
                                type: "channel",
                                data: textChannels?.map((channel) => ({
                                    id: channel.id,
                                    name: channel.name,
                                    icon: iconMap[channel.type]
                                }))
                            },
                            {
                                label: "Voice Channels",
                                type: "channel",
                                data: audioChannels?.map((channel) => ({
                                    id: channel.id,
                                    name: channel.name,
                                    icon: iconMap[channel.type]
                                }))
                            },
                            {
                                label: "Video Channels",
                                type: "channel",
                                data: videoChannels?.map((channel) => ({
                                    id: channel.id,
                                    name: channel.name,
                                    icon: iconMap[channel.type]
                                }))
                            },
                            {
                                label: "Members",
                                type: "member",
                                data: members?.map((member) => ({
                                    id: member.id,
                                    name: member.profile.name,
                                    icon: roleIconMap[member.role]
                                }))
                            }
                        ]}
                    />
                </div>

                <Separator className='bg-zinc-200 dark:bg-zinc-700 rounded-md my-2' />

                {!!textChannels?.length && (
                    <div className='mb-2'>
                        <ServerSection
                            sectionType='channels'
                            channelType={ChannelType.TEXT}
                            role={role}
                            label="Text Channels"
                            server={server}
                        />
                        {textChannels.map((channel) => (
                            <ServerChannel 
                                key={channel.id}
                                channel={channel}
                                role={role}
                                server={server}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}

export default ServerSidebar