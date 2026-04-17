import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Login(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const router=useRouter();

  const login=async()=>{
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(!error) router.push("/");
  };

  return(
    <div>
      <input onChange={e=>setEmail(e.target.value)} />
      <input type="password" onChange={e=>setPassword(e.target.value)} />
      <button onClick={login}>Login</button>
    </div>
  );
}