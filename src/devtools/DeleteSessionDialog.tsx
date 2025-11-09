import './App.css';
import {
    Button, Dialog, DialogContent, DialogActions, DialogTitle, DialogContentText,
} from '@mui/material';
import { Session } from './types'

interface Props {
    open: boolean
    session: Session | null
    onConfirm(): void
    onCancel(): void
}

export default function DeleteSessionDialog(props: Props) {
    if (!props.session) {
        return null
    }

    return (
        <Dialog open={props.open} onClose={props.onCancel}>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to delete the session "{props.session.name}"?
                    This action cannot be undone and all messages in this session will be permanently lost.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onCancel}>Cancel</Button>
                <Button onClick={props.onConfirm} color="error">Delete</Button>
            </DialogActions>
        </Dialog>
    )
}
