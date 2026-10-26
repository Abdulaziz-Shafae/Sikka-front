'use client';
import {useParams} from 'next/navigation';
import {Checkout} from '@/components/sikka/checkout';
export default function CheckoutPage(){const params=useParams<{visitId:string}>();return <Checkout visitId={Number(params.visitId)}/>;}
