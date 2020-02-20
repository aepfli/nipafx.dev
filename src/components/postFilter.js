import React, { useEffect, useLayoutEffect } from "react"
import { graphql, useStaticQuery } from "gatsby"

import { tagletsFromPath } from "../infra/functions"

import { Channel, Tag } from "./tag"
import Nav from "./nav"

import style from "./postFilter.module.css"
import tagletStyle from "./tag.module.css"

const PostFilter = () => {
	const channelListId = ("post-filter-channels-" + Math.random()).replace("0.", "")
	const tagListId = ("post-filter-tags-" + Math.random()).replace("0.", "")
	useLayoutEffect(() => {
		const channelList = document.getElementById(channelListId)
		const tagList = document.getElementById(tagListId)
		highlightSelectedTaglets(channelList, tagList, tagletsFromPath())
	}, [])
	useEffect(() => {
		const channelList = document.getElementById(channelListId)
		const tagList = document.getElementById(tagListId)
		const pathChangeHandler = () =>
			highlightSelectedTaglets(channelList, tagList, tagletsFromPath())
		window.addEventListener("hashchange", pathChangeHandler, false)
		return () => {
			window.removeEventListener("hashchange", pathChangeHandler)
		}
	})

	const { channels, tags } = channelsAndTags()
	return (
		<Nav title="Filter" headers={["channels", "tags"]} open>
			<div id={channelListId} className={style.entries}>
				<Channel key="all" channel="all" uplink plural />
				<br />
				{channels.map(channel => (
					<Channel key={channel} channel={channel} uplink plural className={channel} />
				))}
			</div>
			<div id={tagListId} className={style.entries}>
				<Tag key="all" uplink tag="all" />
				<br />
				{tags.map(tag => (
					<Tag key={tag} tag={tag} uplink />
				))}
			</div>
		</Nav>
	)
}

const highlightSelectedTaglets = (channelList, tagList, selectedTaglets) => {
	for (let channel = channelList.firstChild; channel !== null; channel = channel.nextSibling) {
		if (channel.dataset.channel) {
			const selected = selectedTaglets.isChannelSelected(channel.dataset.channel)
			channel.classList.toggle(tagletStyle.selected, selected)
		}
	}

	for (let tag = tagList.firstChild; tag !== null; tag = tag.nextSibling) {
		if (tag.dataset.tag) {
			const selected = selectedTaglets.isTagSelected(tag.dataset.tag)
			console.log(tag.dataset.tag, selected)
			const on = tag.classList.toggle(tagletStyle.selected, selected)
			console.log(tag.dataset.tag, on)
		}
	}
}

const channelsAndTags = () => {
	const { channels, tags } = useStaticQuery(graphql`
		query {
			channels: allChannel(sort: { fields: internalName }) {
				nodes {
					internalName
				}
			}
			tags: allPost(sort: { fields: slug }) {
				group(field: tags) {
					slug: fieldValue
				}
			}
		}
	`)
	return {
		channels: channels.nodes.map(node => node.internalName),
		tags: tags.group.map(group => group.slug),
	}
}

export default PostFilter
