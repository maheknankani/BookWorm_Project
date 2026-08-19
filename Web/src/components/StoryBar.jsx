import React from 'react'
import { Plus, User } from 'lucide-react'

export default function StoryBar({
  storyGroups = [],
  currentUser,
  onOpenCreateStory,
  onSelectStoryGroup,
}) {
  const safeGroups = Array.isArray(storyGroups) ? storyGroups : []
  const currentUserGroup = safeGroups.find((g) => g && g.isCurrentUser)
  const otherGroups = safeGroups.filter((g) => g && !g.isCurrentUser)

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-8 select-none">
      <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-none">
        {/* CURRENT USER STORY / ADD BUTTON */}
        <div
          className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
          onClick={() => {
            if (currentUserGroup && currentUserGroup.stories.length > 0) {
              onSelectStoryGroup(currentUserGroup)
            } else {
              onOpenCreateStory()
            }
          }}
        >
          <div className="relative w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            {currentUserGroup && currentUserGroup.stories.length > 0 ? (
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#CA1D7E] via-[#F2703F] to-[#F99C4B] p-[2.5px] flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-white p-[2.5px] overflow-hidden flex items-center justify-center">
                  {currentUser?.profileImage ? (
                    <img
                      src={currentUser.profileImage}
                      alt={currentUser.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                      <User className="h-6 w-6" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center">
                {currentUser?.profileImage ? (
                  <img
                    src={currentUser.profileImage}
                    alt={currentUser.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                    <User className="h-6 w-6" />
                  </div>
                )}
              </div>
            )}

            {/* BLUE (+) PLUS BADGE */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenCreateStory()
              }}
              className="absolute bottom-0 right-0 bg-[#0095f6] text-white rounded-full p-1 border-2 border-white shadow-md hover:bg-blue-600 transition-colors"
              title="Add Story"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
            </button>
          </div>
          <span className="text-xs font-normal text-gray-800 mt-2 truncate w-16 text-center">
            Your story
          </span>
        </div>

        {/* OTHER COMMUNITY MEMBERS */}
        {otherGroups.map((group) => {
          const author = group.user
          return (
            <div
              key={author._id}
              onClick={() => onSelectStoryGroup(group)}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                {group.hasUnviewed ? (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#CA1D7E] via-[#F2703F] to-[#F99C4B] p-[2.5px] flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-white p-[2.5px] overflow-hidden flex items-center justify-center">
                      {author?.profileImage ? (
                        <img
                          src={author.profileImage}
                          alt={author.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-700 text-lg">
                          {author?.username ? author.username[0].toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full rounded-full border-[1.5px] border-gray-300 p-[2px] flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                      {author?.profileImage ? (
                        <img
                          src={author.profileImage}
                          alt={author.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-700 text-lg">
                          {author?.username ? author.username[0].toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-xs font-normal text-gray-800 mt-2 truncate w-16 text-center">
                {author?.username || 'user'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
