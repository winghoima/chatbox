import { useEffect, useState, useRef ,useMemo } from 'react';
import { ChatCompletionRequestMessage, ChatCompletionRequestMessageRoleEnum } from './openai-node';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import { Button, Divider, ListItem, Typography, Grid, TextField, Menu, MenuProps } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SettingsIcon from '@mui/icons-material/Settings';
import MarkdownIt from 'markdown-it'
import mdKatex from '@traptitech/markdown-it-katex'
import hljs from 'highlight.js'
import 'katex/dist/katex.min.css'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import { styled, alpha } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import * as wordCount from './utils'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import 'github-markdown-css/github-markdown-light.css'
import mila from 'markdown-it-link-attributes'

const md = new MarkdownIt({
    linkify: true,
    breaks: true,
    highlight: (str: string, lang: string, attrs: string): string => {
        let content = str
        if (lang && hljs.getLanguage(lang)) {
            try {
                content = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
            } catch (e) {
                console.log(e)
                return str
            }
        } else {
            content = md.utils.escapeHtml(str)
        }
        const escapedCode = md.utils.escapeHtml(str)
        return `<div class="code-block-wrapper">
            <button class="code-copy-btn" data-code="${escapedCode}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
            </button>
            <pre class="hljs" style="max-width: 50vw; overflow: auto"><code>${content}</code></pre>
        </div>`;
    }
});
md.use(mdKatex, { blockClass: 'katexmath-block rounded-md p-[10px]', errorColor: ' #cc0000' })
md.use(mila, { attrs: { target: "_blank", rel: "noopener" } })

export type Message = ChatCompletionRequestMessage & {
    id: string
}

export interface Props {
    id?: string
    msg: Message
    showWordCount: boolean
    showTokenCount: boolean
    setMsg: (msg: Message) => void
    delMsg: () => void
    refreshMsg: () => void
    copyMsg: () => void
    quoteMsg: () => void
}

function _Block(props: Props) {
    const { msg, setMsg } = props
    const [isHovering, setIsHovering] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    useEffect(() => {
        if (!contentRef.current) return

        const handleCopyClick = (e: Event) => {
            const button = e.currentTarget as HTMLButtonElement
            const code = button.getAttribute('data-code')
            if (!code) return

            navigator.clipboard.writeText(code).then(() => {
                const originalText = button.innerHTML
                button.classList.add('copied')
                button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>Copied!`

                setTimeout(() => {
                    button.classList.remove('copied')
                    button.innerHTML = originalText
                }, 2000)
            }).catch(err => {
                console.error('Failed to copy:', err)
            })
        }

        const copyButtons = contentRef.current.querySelectorAll('.code-copy-btn')
        copyButtons.forEach(button => {
            button.addEventListener('click', handleCopyClick)
        })

        return () => {
            copyButtons.forEach(button => {
                button.removeEventListener('click', handleCopyClick)
            })
        }
    }, [msg.content])


    const tips: string[] = []
    if (props.showWordCount) {
        tips.push(`word count: ${wordCount.countWord(msg.content)}`)
    }
    if (props.showTokenCount) {
        tips.push(`token estimate: ${wordCount.estimateTokens(msg.content)}`)
    }
    return (
        <ListItem
            id={props.id}
            key={msg.id}
            onMouseEnter={() => {
                setIsHovering(true)
            }}
            onMouseOver={() => {
                setIsHovering(true)
            }}
            onMouseLeave={() => {
                setIsHovering(false)
            }}
            sx={{
                padding: '22px 28px',
            }}
        >
            <Grid container spacing={2}>
                <Grid item>
                    {
                        isEditing ? (
                            <Select
                                value={msg.role}
                                onChange={(e: SelectChangeEvent) => {
                                    setMsg && setMsg({ ...msg, role: e.target.value as ChatCompletionRequestMessageRoleEnum })
                                }}
                                size='small'
                                id={msg.id + 'select'}
                            >
                                <MenuItem value={ChatCompletionRequestMessageRoleEnum.System}>
                                    <Avatar ><SettingsIcon /></Avatar>
                                </MenuItem>
                                <MenuItem value={ChatCompletionRequestMessageRoleEnum.User}>
                                    <Avatar><PersonIcon /></Avatar>
                                </MenuItem>
                                <MenuItem value={ChatCompletionRequestMessageRoleEnum.Assistant}>
                                    <Avatar><SmartToyIcon /></Avatar>
                                </MenuItem>
                            </Select>
                        ) : (
                            {
                                assistant: <Avatar><SmartToyIcon /></Avatar>,
                                user: <Avatar><PersonIcon /></Avatar>,
                                system: <Avatar><SettingsIcon /></Avatar>
                            }[msg.role]
                        )
                    }
                </Grid>
                <Grid item xs={11} sm container>
                    <Grid item xs container direction="column" spacing={2}>
                        <Grid item xs>
                            <Typography variant="overline" component="div">
                                {msg.role}
                            </Typography>
                            {
                                isEditing ? (
                                    <TextField
                                        style={{
                                            width: "100%",
                                        }}
                                        multiline
                                        placeholder="prompt"
                                        value={msg.content}
                                        onChange={(e) => { setMsg && setMsg({ ...msg, content: e.target.value }) }}
                                        id={msg.id + 'input'}
                                    />
                                ) : (
                                    <Box
                                        ref={contentRef}
                                        sx={{
                                            // bgcolor: "Background",
                                        }}
                                        dangerouslySetInnerHTML={{ __html: md.render(msg.content) }}
                                    />
                                )
                            }
                            <Typography variant="body2" color="GrayText" sx={{opacity: 0.5}} >
                                {
                                    tips.join(', ')
                                }
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid item xs={1}>
                        {
                            isEditing ? (
                                <>
                                <Button onClick={() => setIsEditing(false)}>
                                    <CheckIcon fontSize='small' />
                                </Button>
                                </>
                            ) : (
                                isHovering && (
                                    <>
                                        <Button onClick={() => props.refreshMsg()}>
                                            <RefreshIcon fontSize='small' />
                                        </Button>
                                        <Button onClick={handleClick}>
                                            <MoreVertIcon />
                                        </Button>
                                        <StyledMenu
                                            MenuListProps={{
                                                'aria-labelledby': 'demo-customized-button',
                                            }}
                                            anchorEl={anchorEl}
                                            open={open}
                                            onClose={handleClose}
                                            key={msg.id + 'menu'}
                                        >
                                            <MenuItem key={msg.id + 'copy'} onClick={() => {
                                                props.copyMsg()
                                                setAnchorEl(null)
                                            }} disableRipple>
                                                <ContentCopyIcon />
                                                Copy
                                            </MenuItem>

                                            <MenuItem key={msg.id + 'edit'} onClick={() => {
                                                setIsHovering(false)
                                                setAnchorEl(null)
                                                setIsEditing(true)
                                            }} disableRipple>
                                                <EditIcon />
                                                Edit
                                            </MenuItem>
                                            <MenuItem key={msg.id + 'quote'} onClick={() => {
                                                setIsHovering(false)
                                                setAnchorEl(null)
                                                props.quoteMsg()
                                            }} disableRipple>
                                                <FormatQuoteIcon />
                                                Quote
                                            </MenuItem>
                                            <Divider sx={{ my: 0.5 }} />
                                            <MenuItem key={msg.id + 'del'} onClick={() => {
                                                setIsEditing(false)
                                                setIsHovering(false)
                                                setAnchorEl(null)
                                                props.delMsg()
                                            }} disableRipple
                                            >
                                                <DeleteForeverIcon />
                                                Delete
                                            </MenuItem>
                                        </StyledMenu>
                                    </>)
                            )
                        }
                    </Grid>
                </Grid>
            </Grid>
        </ListItem>
    );
}

// <Divider variant="middle" light />
const StyledMenu = styled((props: MenuProps) => (
    <Menu
        elevation={0}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: 6,
        marginTop: theme.spacing(1),
        minWidth: 140,
        color:
            theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
        boxShadow:
            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
        '& .MuiMenu-list': {
            padding: '4px 0',
        },
        '& .MuiMenuItem-root': {
            '& .MuiSvgIcon-root': {
                fontSize: 18,
                color: theme.palette.text.secondary,
                marginRight: theme.spacing(1.5),
            },
            '&:active': {
                backgroundColor: alpha(
                    theme.palette.primary.main,
                    theme.palette.action.selectedOpacity,
                ),
            },
        },
    },
}));

export default function Block(props: Props) {
    return useMemo(() => {
        return <_Block {...props} />
    }, [props.msg, props.showWordCount, props.showTokenCount])
}
